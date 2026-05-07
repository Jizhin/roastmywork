import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

STATUS = [
    ('pending',    'Pending'),
    ('processing', 'Processing'),
    ('completed',  'Completed'),
    ('failed',     'Failed'),
]


class JDMatch(models.Model):
    id             = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user           = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    resume_text    = models.TextField()
    jd_text        = models.TextField()
    result         = models.JSONField(null=True, blank=True)
    status         = models.CharField(max_length=20, choices=STATUS, default='pending')
    created_at     = models.DateTimeField(auto_now_add=True)


class InterviewSession(models.Model):
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user         = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    role         = models.CharField(max_length=200)
    company_type = models.CharField(max_length=50)
    round_type   = models.CharField(max_length=50)
    questions    = models.JSONField(null=True, blank=True)
    answers      = models.JSONField(null=True, blank=True)
    result       = models.JSONField(null=True, blank=True)
    status       = models.CharField(max_length=20, choices=STATUS, default='pending')
    created_at   = models.DateTimeField(auto_now_add=True)


class LinkedInDM(models.Model):
    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user            = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    target_info     = models.TextField()
    purpose         = models.CharField(max_length=60)
    user_background = models.TextField()
    result          = models.JSONField(null=True, blank=True)
    status          = models.CharField(max_length=20, choices=STATUS, default='pending')
    created_at      = models.DateTimeField(auto_now_add=True)


class LinkedInOptimize(models.Model):
    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user            = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    current_profile = models.TextField()
    target_role     = models.CharField(max_length=200, blank=True)
    result          = models.JSONField(null=True, blank=True)
    status          = models.CharField(max_length=20, choices=STATUS, default='pending')
    created_at      = models.DateTimeField(auto_now_add=True)


class SalaryAnalysis(models.Model):
    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user            = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    offer_details   = models.TextField()
    experience_info = models.TextField()
    situation       = models.TextField()
    result          = models.JSONField(null=True, blank=True)
    status          = models.CharField(max_length=20, choices=STATUS, default='pending')
    created_at      = models.DateTimeField(auto_now_add=True)
