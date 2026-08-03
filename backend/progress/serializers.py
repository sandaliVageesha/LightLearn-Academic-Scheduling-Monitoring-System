from rest_framework import serializers
from .models import Activities, Progress


class ActivitiesSerializer(serializers.ModelSerializer):
    """Activities Model Serializer"""
    is_overdue = serializers.BooleanField(read_only=True)
    progress_summary = serializers.DictField(read_only=True)
    
    class Meta:
        model = Activities
        fields = [
            'id', 'name', 'description', 'due_date', 'optional',
            'courses', 'is_overdue', 'progress_summary',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class ProgressSerializer(serializers.ModelSerializer):
    """Progress Model Serializer"""
    student_name = serializers.CharField(source='students.name', read_only=True)
    activity_name = serializers.CharField(source='activities.name', read_only=True)
    
    class Meta:
        model = Progress
        fields = [
            'id', 'students', 'student_name',
            'activities', 'activity_name',
            'value', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class ActivityWithProgressSerializer(serializers.ModelSerializer):
    """Activity එක සමග Progress data එකත් එක්ක ගන්න"""
    progress = ProgressSerializer(many=True, read_only=True)
    progress_summary = serializers.DictField(read_only=True)
    
    class Meta:
        model = Activities
        fields = [
            'id', 'name', 'description', 'due_date', 'optional',
            'courses', 'progress', 'progress_summary',
            'created_at', 'updated_at'
        ]


class BulkProgressUpdateSerializer(serializers.Serializer):
    """Bulk Progress Update සඳහා Serializer"""
    updates = serializers.ListField(
        child=serializers.DictField(
            child=serializers.IntegerField(),
            allow_empty=False
        )
    )
    
    def validate_updates(self, value):
        for update in value:
            if 'student_id' not in update or 'value' not in update:
                raise serializers.ValidationError(
                    "Each update must have 'student_id' and 'value'"
                )
            if update['value'] < 0 or update['value'] > 100:
                raise serializers.ValidationError(
                    f"Progress value for student {update['student_id']} must be between 0 and 100"
                )
        return value