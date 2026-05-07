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


class SubmitRoastView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
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

        if request.user.is_authenticated and not profile.is_pro:
            UserProfile.objects.filter(user=request.user).update(
                roast_credits=F('roast_credits') - 1
            )

        process_roast.delay(str(submission.id))

        return Response(
            {'id': submission.id, 'status': submission.status},
            status=status.HTTP_202_ACCEPTED,
        )


class RoastDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        submission = get_object_or_404(RoastSubmission, pk=pk)

        # Non-public submissions only visible to their owner
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
