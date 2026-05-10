from django.contrib import admin
from django.contrib.auth.models import User
from .models import UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['get_email', 'get_username', 'roast_credits', 'is_pro', 'created_at']
    list_filter = ['is_pro']
    search_fields = ['user__username', 'user__email']
    ordering = ['-created_at']

    @admin.display(description='Email')
    def get_email(self, obj):
        return obj.user.email

    @admin.display(description='Username')
    def get_username(self, obj):
        return obj.user.username

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')
