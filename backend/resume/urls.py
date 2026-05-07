from django.urls import path
from .views import GenerateResumeView, ResumeDetailView, UpdateResumeView, ResumeUpdateDetailView

urlpatterns = [
    path('generate/', GenerateResumeView.as_view(), name='resume-generate'),
    path('<uuid:pk>/', ResumeDetailView.as_view(), name='resume-detail'),
    path('update/', UpdateResumeView.as_view(), name='resume-update'),
    path('update/<uuid:pk>/', ResumeUpdateDetailView.as_view(), name='resume-update-detail'),
]
