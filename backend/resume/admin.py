from django.contrib import admin
from .models import ResumeSubmission


@admin.register(ResumeSubmission)
class ResumeSubmissionAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'target_role', 'status', 'created_at']
    list_filter = ['status']
