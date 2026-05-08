from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import F

from .models import RoastSubmission
from .serializers import (
    RoastSubmissionCreateSerializer,
    RoastSubmissionSerializer,
    RoastSubmissionListSerializer,
)
from .tasks import process_roast
from users.models import UserProfile

_BROKER_DOWN = {'detail': 'Task queue temporarily unavailable. Please try again in a moment.'}


class SubmitRoastView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        profile = None
        if request.user.is_authenticated:
            profile, _ = UserProfile.objects.get_or_create(user=request.user)
            if not profile.is_pro and profile.roast_credits <= 0:
                return Response(
                    {
                        'detail': 'You have no roast credits left. Upgrade to Pro for unlimited roasts.',
                        'code': 'no_credits',
                    },
                    status=status.HTTP_402_PAYMENT_REQUIRED,
                )

        serializer = RoastSubmissionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        submission = serializer.save(
            user=request.user if request.user.is_authenticated else None
        )

        # Deduct before dispatch so the credit is held; refunded if broker is down
        credits_deducted = False
        if request.user.is_authenticated and profile and not profile.is_pro:
            UserProfile.objects.filter(user=request.user).update(roast_credits=F('roast_credits') - 1)
            credits_deducted = True

        try:
            process_roast.delay(str(submission.id))
        except Exception as exc:
            import logging
            logging.getLogger(__name__).error('Broker dispatch failed [process_roast]: %r', exc)
            submission.status = 'failed'
            submission.save(update_fields=['status'])
            if credits_deducted:
                UserProfile.objects.filter(user=request.user).update(roast_credits=F('roast_credits') + 1)
            return Response(_BROKER_DOWN, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        return Response(
            {'id': submission.id, 'status': submission.status},
            status=status.HTTP_202_ACCEPTED,
        )


class RoastDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        submission = get_object_or_404(RoastSubmission, pk=pk)

        if not submission.is_public:
            if not request.user.is_authenticated or submission.user != request.user:
                return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = RoastSubmissionSerializer(submission)
        return Response(serializer.data)


class RoastHistoryView(generics.ListAPIView):
    serializer_class = RoastSubmissionListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return RoastSubmission.objects.filter(user=self.request.user)
