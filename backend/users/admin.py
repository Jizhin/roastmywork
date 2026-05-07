from django.contrib import admin
from .models import UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'roast_credits', 'is_pro', 'created_at']
    list_filter = ['is_pro']
    search_fields = ['user__username', 'user__email']
