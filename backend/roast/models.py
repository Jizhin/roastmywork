from django.db import models
from django.contrib.auth.models import User
import uuid


class RoastSubmission(models.Model):
    WORK_TYPE_CHOICES = [
        ('resume', 'Resume'),
        ('code', 'Code'),
        ('pitch_deck', 'Pitch Deck'),
        ('linkedin', 'LinkedIn Profile'),
        ('essay', 'Essay'),
        ('ui_design', 'UI Design'),
    ]

    INTENSITY_CHOICES = [
        ('gentle', 'Gentle'),
        ('honest', 'Honest'),
        ('gordon_ramsay', 'Gordon Ramsay'),
        ('simon_cowell', 'Simon Cowell'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='roasts'
    )
    work_type = models.CharField(max_length=20, choices=WORK_TYPE_CHOICES)
    input_text = models.TextField(blank=True, null=True)
    file = models.FileField(upload_to='roast_files/', blank=True, null=True)
    roast_output = models.TextField(blank=True, null=True)
    fix_output = models.TextField(blank=True, null=True)
    score = models.IntegerField(null=True, blank=True)
    intensity = models.CharField(max_length=20, choices=INTENSITY_CHOICES, default='honest')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    fixed_resume_data = models.JSONField(null=True, blank=True)
    fixed_code = models.TextField(null=True, blank=True)
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_work_type_display()} [{self.get_intensity_display()}] — {self.status}"
