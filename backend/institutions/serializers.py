from rest_framework import serializers
from institutions.models import Institution, User, ActivityLog, LoginActivity, Notification


class UserSerializer(serializers.ModelSerializer):
    """Used for reading owner details."""
    class Meta:
        model  = User
        fields = ['id', 'username', 'email']


class InstitutionCreateSerializer(serializers.Serializer):
    """Used when creating an institution (includes owner credentials)."""
    name             = serializers.CharField(max_length=255)
    logo             = serializers.ImageField(required=False, allow_null=True)
    username         = serializers.CharField(max_length=150)
    email            = serializers.EmailField()
    password         = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError(
                {'confirm_password': 'Passwords do not match.'}
            )
        if User.objects.filter(username=data['username']).exists():
            raise serializers.ValidationError(
                {'username': 'Username already taken.'}
            )
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError(
                {'email': 'Email already registered.'}
            )
        return data


class InstitutionUpdateSerializer(serializers.Serializer):
    """Used when updating an institution."""
    name             = serializers.CharField(max_length=255, required=False)
    logo             = serializers.ImageField(required=False, allow_null=True)
    username         = serializers.CharField(max_length=150, required=False)
    email            = serializers.EmailField(required=False)
    password         = serializers.CharField(write_only=True, min_length=6, required=False, allow_blank=True)
    confirm_password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    def validate(self, data):
        password = data.get('password', '')
        confirm  = data.get('confirm_password', '')
        if password or confirm:
            if password != confirm:
                raise serializers.ValidationError(
                    {'confirm_password': 'Passwords do not match.'}
                )
        return data


class InstitutionListSerializer(serializers.ModelSerializer):
    """Used for list and detail views."""
    owner = UserSerializer(read_only=True)

    class Meta:
        model  = Institution
        fields = ['id', 'name', 'logo', 'owner', 'status', 'created_at', 'updated_at']


class ActivityLogSerializer(serializers.ModelSerializer):
    """Maintenance > Audit Logs: who did what, in the institution module."""
    actor_name  = serializers.SerializerMethodField()
    actor_email = serializers.CharField(source='actor.email', default=None, read_only=True)

    class Meta:
        model  = ActivityLog
        fields = ['id', 'actor_name', 'actor_email', 'action', 'module', 'description', 'timestamp']

    def get_actor_name(self, obj):
        return obj.actor.username if obj.actor else 'System'


class LoginActivitySerializer(serializers.ModelSerializer):
    """Maintenance > Login Activity: who logged in/out, from where, when."""

    class Meta:
        model  = LoginActivity
        fields = ['id', 'email', 'action', 'ip_address', 'timestamp']


class NotificationSerializer(serializers.ModelSerializer):
    """Dashboard navbar bell — a single user's own notifications."""

    class Meta:
        model  = Notification
        fields = ['id', 'title', 'message', 'link', 'is_read', 'created_at']