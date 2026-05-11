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

        try:
            idinfo = id_token.verify_oauth2_token(
                credential,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID,
            )
        except ValueError:
            return Response({'detail': 'Invalid Google token.'}, status=status.HTTP_400_BAD_REQUEST)

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


def _unique_username(email):
    base = email.split('@')[0][:140]
    username, n = base, 1
    while User.objects.filter(username=username).exists():
        username = f'{base}{n}'
        n += 1
    return username
