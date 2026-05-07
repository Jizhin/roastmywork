from rest_framework import serializers
from .models import RoastSubmission


class RoastSubmissionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoastSubmission
        fields = ['work_type', 'intensity', 'input_text', 'file']

    def validate(self, data):
        if not data.get('input_text') and not data.get('file'):
            raise serializers.ValidationError('Provide either input_text or a file.')
        return data


class RoastSubmissionSerializer(serializers.ModelSerializer):
    work_type_display = serializers.CharField(source='get_work_type_display', read_only=True)
    intensity_display = serializers.CharField(source='get_intensity_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = RoastSubmission
        fields = [
            'id', 'work_type', 'work_type_display',
            'intensity', 'intensity_display',
            'status', 'status_display',
            'roast_output', 'fix_output', 'score',
            'fixed_resume_data', 'fixed_code',
            'is_public', 'created_at',
        ]
        read_only_fields = fields


class RoastSubmissionListSerializer(serializers.ModelSerializer):
    work_type_display = serializers.CharField(source='get_work_type_display', read_only=True)
    intensity_display = serializers.CharField(source='get_intensity_display', read_only=True)

    class Meta:
        model = RoastSubmission
        fields = [
            'id', 'work_type', 'work_type_display',
            'intensity', 'intensity_display',
            'score', 'status', 'is_public', 'created_at',
        ]
