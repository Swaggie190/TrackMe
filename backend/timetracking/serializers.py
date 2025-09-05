from rest_framework import serializers
from rest_framework_mongoengine import serializers as me_serializers
from django.contrib.auth import authenticate
from .models import User, TimeEntry, TrackerSession
from datetime import datetime, timedelta
from django.utils import timezone


class UserRegistrationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, max_length=128, write_only=True)
    display_name = serializers.CharField(min_length=2, max_length=100)
    
    def validate_email(self, value):
        email = value.lower().strip()
        
        try:
            User.objects.get(email=email)
            raise serializers.ValidationError("A user with this email already exists.")
        except User.DoesNotExist:
            return email
    
    def validate_password(self, value):
        if value.isdigit():
            raise serializers.ValidationError("Password cannot be entirely numeric.")
        if len(value.strip()) != len(value):
            raise serializers.ValidationError("Password cannot start or end with whitespace.")
        return value
    
    def create(self, validated_data):
        user = User(
            email=validated_data['email'],
            display_name=validated_data['display_name']
        )
        user.set_password(validated_data['password'])
        user.save()
        return user


class UserLoginSerializer(serializers.Serializer):

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        email = data['email'].lower().strip()
        password = data['password']
        
        try:
            user = User.objects.get(email=email)
            if user.check_password(password):
                data['user'] = user
                return data
            else:
                raise serializers.ValidationError("Invalid password.")
        except User.DoesNotExist:
            raise serializers.ValidationError("User with this email does not exist.")


class UserProfileSerializer(me_serializers.DocumentSerializer):
    id = serializers.CharField(read_only=True)
    email = serializers.EmailField(read_only=True)
    display_name = serializers.CharField(min_length=2, max_length=100)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'email', 'display_name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'email', 'created_at', 'updated_at']
    
    def update(self, instance, validated_data):
        instance.display_name = validated_data.get('display_name', instance.display_name)
        instance.save()
        return instance


class TimeEntrySerializer(me_serializers.DocumentSerializer):
    id = serializers.CharField(read_only=True)
    user = serializers.CharField(read_only=True)
    description = serializers.CharField(min_length=3, max_length=1000)
    duration_seconds = serializers.IntegerField(min_value=1)
    start_time = serializers.DateTimeField(required=False, allow_null=True)
    end_time = serializers.DateTimeField()
    booked_from_tracker = serializers.BooleanField(default=False)
    created_at = serializers.DateTimeField(read_only=True)
    metadata = serializers.DictField(required=False, allow_empty=True)
    duration_display = serializers.SerializerMethodField()
    
    def get_duration_display(self, obj):
        hours, remainder = divmod(obj.duration_seconds, 3600)
        minutes, seconds = divmod(remainder, 60)
        return f"{hours:02d}:{minutes:02d}:{seconds:02d}"
    
    def create(self, validated_data):
        time_entry = TimeEntry(**validated_data)
        time_entry.save()
        return time_entry
    
    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
    
    def validate_end_time(self, value):
    
        if value:
            now = timezone.now()
            if value.tzinfo is None:
                value = timezone.make_aware(value)
            max_future = now + timedelta(minutes=5)
            if value > max_future:
                raise serializers.ValidationError(
                    "End time cannot be more than 5 minutes in the future."
                )
        return value
    
    def validate_duration_seconds(self, value):
  
        if value <= 0:
            raise serializers.ValidationError("Duration must be greater than 0 seconds.")
        return value
    
    def validate_description(self, value):

        if not value or not value.strip():
            raise serializers.ValidationError("Description cannot be empty.")
        
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Description must be at least 3 characters long.")
        
        return value.strip()


class TimeEntryCreateSerializer(TimeEntrySerializer):
    
    class Meta:
        model = TimeEntry
        fields = [
            'id', 'description', 'duration_seconds', 'start_time', 'end_time', 
            'booked_from_tracker', 'metadata', 'created_at', 'duration_display'
        ]
        read_only_fields = ['id', 'created_at', 'duration_display']
    
    def validate(self, data):
        booked_from_tracker = data.get('booked_from_tracker', False)
        
        if booked_from_tracker:
            if 'duration_seconds' in data:
                data.pop('duration_seconds') 
        else:
            if 'duration_seconds' not in data:
                raise serializers.ValidationError(
                    "Duration is required for manual time entries."
                )
            
            if 'end_time' not in data:
                raise serializers.ValidationError(
                    "End time is required for manual time entries."
                )
            if 'start_time' in data and 'end_time' in data and data['start_time'] and data['end_time']:
                start_time = data['start_time']
                end_time = data['end_time']
            
                if start_time.tzinfo is None:
                    start_time = timezone.make_aware(start_time)
                    data['start_time'] = start_time
                
                if end_time.tzinfo is None:
                    end_time = timezone.make_aware(end_time)
                    data['end_time'] = end_time
        
                if start_time >= end_time:
                    raise serializers.ValidationError(
                        "Start time must be before end time."
                    )
        
        return data


class TrackerSessionSerializer(me_serializers.DocumentSerializer):
    id = serializers.CharField(read_only=True)
    user = serializers.CharField(read_only=True)
    started_at = serializers.DateTimeField()
    paused_at = serializers.DateTimeField(allow_null=True, required=False)
    accumulated_seconds = serializers.IntegerField(min_value=0)
    is_running = serializers.BooleanField()
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    current_elapsed_seconds = serializers.SerializerMethodField()
    
    def get_current_elapsed_seconds(self, obj):
        return obj.get_current_elapsed_seconds()


class TrackerStatusSerializer(serializers.Serializer):

    is_running = serializers.BooleanField()
    current_elapsed_seconds = serializers.IntegerField()
    started_at = serializers.DateTimeField(allow_null=True)
    paused_at = serializers.DateTimeField(allow_null=True)


class TrackerActionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=[
        ('start', 'Start'),
        ('pause', 'Pause'),
        ('resume', 'Resume'), 
        ('reset', 'Reset')
    ])


class TimeEntryListSerializer(TimeEntrySerializer):

    class Meta:
        model = TimeEntry
        fields = [
            'id', 'description', 'duration_seconds', 'duration_display',
            'end_time', 'booked_from_tracker', 'created_at'
        ]
        read_only_fields = ['id', 'duration_display', 'created_at']