import threading
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import F

from .models import ResumeSubmission, ResumeUpdate
from .serializers import (
    ResumeCreateSerializer, ResumeSerializer,
    ResumeUpdateCreateSerializer, ResumeUpdateSerializer,
)
from .tasks import generate_resume, update_resume
from users.models import UserProfile


def _dispatch(fn, obj_id):
    threading.Thread(target=fn, args=(str(obj_id),), daemon=True).start()


class GenerateResumeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        if not profile.is_pro and profile.roast_credits <= 0:
            return Response(
                {'detail': 'No credits left. Upgrade to Pro for unlimited usage.', 'code': 'no_credits'},
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )

        serializer = ResumeCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        submission = serializer.save(user=request.user)

        if not profile.is_pro:
            UserProfile.objects.filter(user=request.user).update(roast_credits=F('roast_credits') - 1)

        _dispatch(generate_resume, submission.id)

        return Response({'id': submission.id, 'status': submission.status}, status=status.HTTP_202_ACCEPTED)


class ResumeDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        submission = get_object_or_404(ResumeSubmission, pk=pk, user=request.user)
        return Response(ResumeSerializer(submission).data)


class UpdateResumeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        if not profile.is_pro and profile.roast_credits <= 0:
            return Response(
                {'detail': 'No credits left. Upgrade to Pro for unlimited usage.', 'code': 'no_credits'},
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )

        serializer = ResumeUpdateCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        update_obj = serializer.save(user=request.user)

        if not profile.is_pro:
            UserProfile.objects.filter(user=request.user).update(roast_credits=F('roast_credits') - 1)

        _dispatch(update_resume, update_obj.id)

        return Response({'id': update_obj.id, 'status': update_obj.status}, status=status.HTTP_202_ACCEPTED)


class ResumeUpdateDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        update_obj = get_object_or_404(ResumeUpdate, pk=pk, user=request.user)
        return Response(ResumeUpdateSerializer(update_obj).data)
