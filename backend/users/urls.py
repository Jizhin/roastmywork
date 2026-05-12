from django.urls import path
from .views import RegisterView, MeView, GoogleAuthView, AdminUsersView, ActivityHistoryView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('me/', MeView.as_view(), name='me'),
    path('auth/google/', GoogleAuthView.as_view(), name='google-auth'),
    path('admin-users/', AdminUsersView.as_view(), name='admin-users'),
    path('activity/', ActivityHistoryView.as_view(), name='activity-history'),
]
