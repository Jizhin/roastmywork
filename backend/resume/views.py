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

_BROKER_DOWN = {'detail': 'Task queue temporarily unavailable. Please try again in a moment.'}


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

        credits_deducted = False
        if not profile.is_pro:
            UserProfile.objects.filter(user=request.user).update(roast_credits=F('roast_credits') - 1)
            credits_deducted = True

        try:
            generate_resume.delay(str(submission.id))
        except Exception:
            submission.status = 'failed'
            submission.save(update_fields=['status'])
            if credits_deducted:
                UserProfile.objects.filter(user=request.user).update(roast_credits=F('roast_credits') + 1)
            return Response(_BROKER_DOWN, status=status.HTTP_503_SERVICE_UNAVAILABLE)

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

        credits_deducted = False
        if not profile.is_pro:
            UserProfile.objects.filter(user=request.user).update(roast_credits=F('roast_credits') - 1)
            credits_deducted = True

        try:
            update_resume.delay(str(update_obj.id))
        except Exception:
            update_obj.status = 'failed'
            update_obj.save(update_fields=['status'])
            if credits_deducted:
                UserProfile.objects.filter(user=request.user).update(roast_credits=F('roast_credits') + 1)
            return Response(_BROKER_DOWN, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        return Response({'id': update_obj.id, 'status': update_obj.status}, status=status.HTTP_202_ACCEPTED)


class ResumeUpdateDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        update_obj = get_object_or_404(ResumeUpdate, pk=pk, user=request.user)
        return Response(ResumeUpdateSerializer(update_obj).data)
