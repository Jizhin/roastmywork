from django.urls import path
from .views import SubmitRoastView, RoastDetailView, RoastHistoryView

urlpatterns = [
    path('submit/', SubmitRoastView.as_view(), name='roast-submit'),
    path('history/', RoastHistoryView.as_view(), name='roast-history'),
    path('<uuid:pk>/', RoastDetailView.as_view(), name='roast-detail'),
]
