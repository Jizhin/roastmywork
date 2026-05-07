from rest_framework import serializers
from .models import ResumeSubmission, ResumeUpdate


class ResumeCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResumeSubmission
        fields = ['raw_input', 'target_role', 'template']


class ResumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResumeSubmission
        fields = ['id', 'status', 'resume_data', 'target_role', 'template', 'created_at']
        read_only_fields = fields


class ResumeUpdateCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResumeUpdate
        fields = ['file']


class ResumeUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResumeUpdate
        fields = ['id', 'status', 'resume_data', 'issues', 'created_at']
        read_only_fields = fields
