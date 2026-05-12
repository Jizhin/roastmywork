from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.conf import settings
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from .models import UserProfile
from .serializers import RegisterSerializer, UserSerializer
from roast.models import RoastSubmission
from resume.models import ResumeSubmission, ResumeUpdate
from tools.models import JDMatch, InterviewSession, LinkedInDM, LinkedInOptimize, SalaryAnalysis


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class GoogleAuthView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        credential = request.data.get('credential')
        if not credential:
            return Response({'detail': 'Credential required.'}, status=status.HTTP_400_BAD_REQUEST)

        allowed_client_ids = _allowed_google_client_ids()
        if not allowed_client_ids:
            return Response(
                {'detail': 'Google sign-in is not configured on the server.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        try:
            idinfo = id_token.verify_oauth2_token(
                credential,
                google_requests.Request(),
            )
        except ValueError:
            return Response({'detail': 'Invalid Google token.'}, status=status.HTTP_400_BAD_REQUEST)

        if idinfo.get('aud') not in allowed_client_ids:
            return Response({'detail': 'Token audience mismatch.'}, status=status.HTTP_400_BAD_REQUEST)

        if not idinfo.get('email_verified', False):
            return Response({'detail': 'Google email is not verified.'}, status=status.HTTP_400_BAD_REQUEST)

        email = idinfo['email']
        first_name = idinfo.get('given_name', '')
        last_name = idinfo.get('family_name', '')

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': _unique_username(email),
                'first_name': first_name,
                'last_name': last_name,
            },
        )

        if created:
            UserProfile.objects.create(user=user, roast_credits=5)
        else:
            UserProfile.objects.get_or_create(user=user, defaults={'roast_credits': 3})

        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        })


class AdminUsersView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        admin_email = getattr(settings, 'ADMIN_EMAIL', '')
        if not admin_email or request.user.email != admin_email:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        users = User.objects.select_related('profile').order_by('-date_joined')
        data = []
        for user in users:
            profile = getattr(user, 'profile', None)
            data.append({
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'date_joined': user.date_joined,
                'last_login': user.last_login,
                'is_pro': profile.is_pro if profile else False,
                'roast_credits': profile.roast_credits if profile else 0,
            })
        return Response({'count': len(data), 'users': data})


class ActivityHistoryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        limit = min(max(int(request.query_params.get('limit', 40)), 1), 100)
        user = request.user

        items = []

        for r in RoastSubmission.objects.filter(user=user).only(
            'id', 'work_type', 'status', 'created_at', 'score'
        ):
            items.append({
                'id': str(r.id),
                'entry_type': 'roast',
                'tool_key': r.work_type,
                'title': f"Roast: {r.get_work_type_display()}",
                'status': r.status,
                'score': r.score,
                'created_at': r.created_at,
                'detail_path': f"/api/roast/{r.id}/",
            })

        for r in ResumeSubmission.objects.filter(user=user).only(
            'id', 'status', 'created_at', 'target_role', 'template'
        ):
            role = (r.target_role or '').strip()
            items.append({
                'id': str(r.id),
                'entry_type': 'resume_builder',
                'tool_key': 'build_resume',
                'title': f"Resume Builder{f' - {role}' if role else ''}",
                'status': r.status,
                'score': None,
                'created_at': r.created_at,
                'detail_path': f"/api/resume/{r.id}/",
            })

        for r in ResumeUpdate.objects.filter(user=user).only('id', 'status', 'created_at'):
            items.append({
                'id': str(r.id),
                'entry_type': 'resume_update',
                'tool_key': 'fix_resume',
                'title': 'Resume Fix',
                'status': r.status,
                'score': None,
                'created_at': r.created_at,
                'detail_path': f"/api/resume/update/{r.id}/",
            })

        for r in JDMatch.objects.filter(user=user).only('id', 'status', 'created_at'):
            items.append({
                'id': str(r.id),
                'entry_type': 'jd_match',
                'tool_key': 'jd_match',
                'title': 'JD Match',
                'status': r.status,
                'score': None,
                'created_at': r.created_at,
                'detail_path': f"/api/tools/jd-match/{r.id}/",
            })

        for r in InterviewSession.objects.filter(user=user).only('id', 'status', 'created_at', 'role'):
            role = (r.role or '').strip()
            items.append({
                'id': str(r.id),
                'entry_type': 'interview',
                'tool_key': 'interview',
                'title': f"Interview Prep{f' - {role}' if role else ''}",
                'status': r.status,
                'score': None,
                'created_at': r.created_at,
                'detail_path': f"/api/tools/interview/{r.id}/",
            })

        for r in LinkedInDM.objects.filter(user=user).only('id', 'status', 'created_at'):
            items.append({
                'id': str(r.id),
                'entry_type': 'linkedin_dm',
                'tool_key': 'linkedin_dm',
                'title': 'LinkedIn DM',
                'status': r.status,
                'score': None,
                'created_at': r.created_at,
                'detail_path': f"/api/tools/linkedin-dm/{r.id}/",
            })

        for r in LinkedInOptimize.objects.filter(user=user).only('id', 'status', 'created_at'):
            items.append({
                'id': str(r.id),
                'entry_type': 'linkedin_opt',
                'tool_key': 'linkedin_opt',
                'title': 'LinkedIn Optimize',
                'status': r.status,
                'score': None,
                'created_at': r.created_at,
                'detail_path': f"/api/tools/linkedin-opt/{r.id}/",
            })

        for r in SalaryAnalysis.objects.filter(user=user).only('id', 'status', 'created_at'):
            items.append({
                'id': str(r.id),
                'entry_type': 'salary',
                'tool_key': 'salary',
                'title': 'Salary Coach',
                'status': r.status,
                'score': None,
                'created_at': r.created_at,
                'detail_path': f"/api/tools/salary/{r.id}/",
            })

        items.sort(key=lambda x: x['created_at'], reverse=True)
        sliced = items[:limit]
        for it in sliced:
            it['created_at'] = it['created_at'].isoformat()

        return Response({'count': len(sliced), 'results': sliced})

    def delete(self, request):
        user = request.user
        deleted = {}

        deleted['roast'] = RoastSubmission.objects.filter(user=user).delete()[0]
        deleted['resume_builder'] = ResumeSubmission.objects.filter(user=user).delete()[0]
        deleted['resume_update'] = ResumeUpdate.objects.filter(user=user).delete()[0]
        deleted['jd_match'] = JDMatch.objects.filter(user=user).delete()[0]
        deleted['interview'] = InterviewSession.objects.filter(user=user).delete()[0]
        deleted['linkedin_dm'] = LinkedInDM.objects.filter(user=user).delete()[0]
        deleted['linkedin_opt'] = LinkedInOptimize.objects.filter(user=user).delete()[0]
        deleted['salary'] = SalaryAnalysis.objects.filter(user=user).delete()[0]

        return Response({'ok': True, 'deleted': deleted})


def _unique_username(email):
    base = email.split('@')[0][:140]
    username, n = base, 1
    while User.objects.filter(username=username).exists():
        username = f'{base}{n}'
        n += 1
    return username


def _allowed_google_client_ids():
    raw = getattr(settings, 'GOOGLE_CLIENT_IDS', '')
    client_ids = [v.strip() for v in raw.split(',') if v.strip()]
    if client_ids:
        return client_ids

    single = getattr(settings, 'GOOGLE_CLIENT_ID', '').strip()
    return [single] if single else []
