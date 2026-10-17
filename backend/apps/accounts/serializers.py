"""
RouteX Accounts Serializers
Handles user registration, login, profile management, administration serializers,
and platform operational settings.
"""
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import UserProfile, PlatformSettings, SystemAuditLog


class UserPublicSerializer(serializers.ModelSerializer):
    """Public user representation returned after auth actions and in headers."""
    display_name = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    is_superuser = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "display_name", "role", "date_joined", "is_staff", "is_superuser"]
        read_only_fields = fields

    def get_display_name(self, obj):
        try:
            name = obj.profile.display_name
            return name if name else obj.username
        except UserProfile.DoesNotExist:
            return obj.username

    def get_role(self, obj):
        if obj.is_superuser:
            return "admin"
        try:
            role = obj.profile.role
            if role in ["admin", "moderator", "citizen"]:
                return role
            if obj.is_staff:
                return "moderator"
            return "citizen"
        except UserProfile.DoesNotExist:
            return "moderator" if obj.is_staff else "citizen"


class UserRegistrationSerializer(serializers.Serializer):
    """Validates registration fields and creates user + profile with citizen role."""
    username = serializers.CharField(
        min_length=3,
        max_length=150,
        help_text="Unique username (3–150 characters, letters, digits, @/./+/-/_ only).",
    )
    email = serializers.EmailField(
        max_length=254,
        help_text="Valid email address. Used for account recovery.",
    )
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={"input_type": "password"},
        help_text="Password (min 8 characters, cannot be too common or entirely numeric).",
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=False,
        style={"input_type": "password"},
        help_text="Password confirmation matching password.",
    )
    display_name = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=80,
        help_text="Optional display name shown in the app (up to 80 characters).",
    )

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value.lower()

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate(self, attrs):
        pw = attrs.get("password")
        pwc = attrs.get("password_confirm")
        if pwc is not None and pw != pwc:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm", None)
        display_name = validated_data.pop("display_name", "")
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
        )
        UserProfile.objects.create(user=user, display_name=display_name, role="citizen")
        return user


class UserLoginSerializer(serializers.Serializer):
    """Validates login credentials."""
    username = serializers.CharField(
        help_text="Your registered username or email address.",
    )
    password = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
        help_text="Your account password.",
    )


class UserProfileUpdateSerializer(serializers.Serializer):
    """Allows user to update their display name and email address."""
    display_name = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=80,
    )
    email = serializers.EmailField(
        required=False,
        max_length=254,
    )

    def validate_email(self, value):
        user = self.context.get("request").user
        if User.objects.filter(email__iexact=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("This email is already in use by another account.")
        return value.lower()


class AdminUserSerializer(serializers.ModelSerializer):
    """Detailed user view for platform administrators."""
    display_name = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    reports_count = serializers.SerializerMethodField()
    confirmations_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "display_name",
            "role",
            "is_active",
            "is_staff",
            "is_superuser",
            "date_joined",
            "last_login",
            "reports_count",
            "confirmations_count",
        ]
        read_only_fields = fields

    def get_display_name(self, obj):
        try:
            return obj.profile.display_name or obj.username
        except UserProfile.DoesNotExist:
            return obj.username

    def get_role(self, obj):
        if obj.is_superuser:
            return "admin"
        try:
            return obj.profile.role
        except UserProfile.DoesNotExist:
            return "moderator" if obj.is_staff else "citizen"

    def get_reports_count(self, obj):
        return obj.hazard_reports.count() if hasattr(obj, "hazard_reports") else 0

    def get_confirmations_count(self, obj):
        return obj.confirmation_set.count() if hasattr(obj, "confirmation_set") else 0


class UserRoleUpdateSerializer(serializers.Serializer):
    """Validates administrative role changes."""
    role = serializers.ChoiceField(
        choices=["citizen", "moderator", "admin"],
        help_text="New role to assign to the user."
    )
    reason = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=300,
        help_text="Optional administrative audit reason."
    )


class PlatformSettingsSerializer(serializers.ModelSerializer):
    """Serializer for operational platform settings."""
    updated_by_username = serializers.SerializerMethodField()

    class Meta:
        model = PlatformSettings
        fields = [
            "confirmation_threshold",
            "freshness_hours",
            "max_upload_size_mb",
            "allow_anonymous_map_view",
            "emergency_notice_enabled",
            "updated_at",
            "updated_by_username",
        ]
        read_only_fields = ["updated_at", "updated_by_username"]

    def get_updated_by_username(self, obj):
        return obj.updated_by.username if obj.updated_by else "System"

    def validate_confirmation_threshold(self, value):
        if value < 1 or value > 20:
            raise serializers.ValidationError("Confirmation threshold must be between 1 and 20.")
        return value

    def validate_freshness_hours(self, value):
        if value < 1 or value > 168:
            raise serializers.ValidationError("Freshness threshold must be between 1 and 168 hours (7 days).")
        return value

    def validate_max_upload_size_mb(self, value):
        if value < 1 or value > 25:
            raise serializers.ValidationError("Max upload size must be between 1 and 25 MB.")
        return value


class SystemAuditLogSerializer(serializers.ModelSerializer):
    """Serializer for platform audit trail."""
    actor_username = serializers.SerializerMethodField()

    class Meta:
        model = SystemAuditLog
        fields = [
            "id",
            "actor_username",
            "action_type",
            "target_id",
            "details",
            "created_at",
        ]
        read_only_fields = fields

    def get_actor_username(self, obj):
        return obj.actor.username if obj.actor else "System"


class PasswordResetRequestSerializer(serializers.Serializer):
    """Validates password reset request containing user's email address."""
    email = serializers.EmailField(
        max_length=254,
        help_text="Registered email address for the account recovery.",
    )


class PasswordResetValidateSerializer(serializers.Serializer):
    """Validates the reset token and user id from the reset link."""
    uid = serializers.CharField(
        help_text="Base64-encoded user ID from the reset link.",
    )
    token = serializers.CharField(
        help_text="One-time cryptographically signed password reset token.",
    )


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Validates new password and confirms password reset."""
    uid = serializers.CharField(
        help_text="Base64-encoded user ID from the reset link.",
    )
    token = serializers.CharField(
        help_text="One-time cryptographically signed password reset token.",
    )
    new_password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={"input_type": "password"},
        help_text="New password (min 8 characters, cannot be too common).",
    )
    new_password_confirm = serializers.CharField(
        write_only=True,
        min_length=8,
        style={"input_type": "password"},
        help_text="Confirmation matching new password.",
    )

    def validate_new_password(self, value):
        validate_password(value)
        return value

    def validate(self, attrs):
        if attrs.get("new_password") != attrs.get("new_password_confirm"):
            raise serializers.ValidationError({"new_password_confirm": "Passwords do not match."})
        return attrs
