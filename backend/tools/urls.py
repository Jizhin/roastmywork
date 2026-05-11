from django.urls import path
from .views import (
    JDMatchView, JDMatchDetailView,
    InterviewView, InterviewDetailView,
    LinkedInDMView, LinkedInDMDetailView,
    LinkedInOptimizeView, LinkedInOptimizeDetailView,
    SalaryView, SalaryDetailView,
    GenerateColdEmailView, ColdEmailDeductView,
)

urlpatterns = [
    path('jd-match/',              JDMatchView.as_view()),
    path('jd-match/<uuid:pk>/',    JDMatchDetailView.as_view()),
    path('interview/',             InterviewView.as_view()),
    path('interview/<uuid:pk>/',   InterviewDetailView.as_view()),
    path('linkedin-dm/',           LinkedInDMView.as_view()),
    path('linkedin-dm/<uuid:pk>/', LinkedInDMDetailView.as_view()),
    path('linkedin-opt/',          LinkedInOptimizeView.as_view()),
    path('linkedin-opt/<uuid:pk>/',LinkedInOptimizeDetailView.as_view()),
    path('salary/',                SalaryView.as_view()),
    path('salary/<uuid:pk>/',      SalaryDetailView.as_view()),
    path('cold-email/generate/',   GenerateColdEmailView.as_view()),
    path('cold-email/deduct/',     ColdEmailDeductView.as_view()),
]
