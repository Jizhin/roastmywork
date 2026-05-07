from django.contrib import admin
from .models import RoastSubmission


@admin.register(RoastSubmission)
class RoastSubmissionAdmin(admin.ModelAdmin):
    list_display = ['id', 'work_type', 'intensity', 'score', 'status', 'user', 'is_public', 'created_at']
    list_filter = ['work_type', 'intensity', 'status', 'is_public']
    search_fields = ['id', 'user__username', 'roast_output']
    readonly_fields = ['id', 'created_at', 'updated_at', 'roast_output', 'fix_output', 'score']
    ordering = ['-created_at']
