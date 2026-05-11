from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('api/health/', lambda req: JsonResponse({'ok': True}), name='health'),
    path('admin/', admin.site.urls),
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/users/', include('users.urls')),
    path('api/roast/', include('roast.urls')),
    path('api/resume/', include('resume.urls')),
    path('api/tools/',  include('tools.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
