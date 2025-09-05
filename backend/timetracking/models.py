from datetime import datetime, timedelta
from mongoengine import (
    Document, 
    StringField, EmailField, IntField, DateTimeField, 
    BooleanField, DictField, ReferenceField, ValidationError
)
from django.contrib.auth.hashers import make_password, check_password
import re
from django.utils import timezone



class User(Document):
    email = EmailField(required=True, unique=True, max_length=254)
    password_hash = StringField(required=True, max_length=255)
    display_name = StringField(required=True, min_length=2, max_length=100)
    created_at = DateTimeField(default=timezone.now)
    updated_at = DateTimeField(default=timezone.now)
    
    meta = {
        'collection': 'users', 
        'indexes': [
            'email', 
            'created_at'
        ]
    }
    
    def set_password(self, raw_password):
        self.password_hash = make_password(raw_password)
    
    def check_password(self, raw_password):
        return check_password(raw_password, self.password_hash)
    
    def clean(self):
        if self.email:
            self.email = self.email.lower().strip()
        
        self.updated_at = timezone.now()
        
        if self.display_name and not self.display_name.strip():
            raise ValidationError("Display name cannot be empty or only whitespace")
    
    def __str__(self):
        return f"User: {self.email} ({self.display_name})"


class TimeEntry(Document):
    user = ReferenceField(User, required=True, reverse_delete_rule=2) 
    description = StringField(required=True, min_length=3, max_length=1000)
    duration_seconds = IntField(required=True, min_value=1)  # Must be positive
    start_time = DateTimeField()
    end_time = DateTimeField(required=True)
    booked_from_tracker = BooleanField(default=False)

    created_at = DateTimeField(default=timezone.now)
    
    metadata = DictField()
    
    meta = {
        'collection': 'time_entries',
        'indexes': [
            'user', 
            'end_time',  
            'created_at',
            ('user', '-end_time'), 
        ]
    }
    
    def clean(self):
        if self.end_time:
            now = timezone.now()
            
            end_time = self.end_time
            if end_time.tzinfo is None:
                end_time = timezone.make_aware(end_time)
            
            max_future = now + timedelta(minutes=5)
            if end_time > max_future:
                raise ValidationError("End time cannot be more than 5 minutes in the future")
        
        if self.start_time and self.end_time:
            start_time = self.start_time
            end_time = self.end_time

            if start_time.tzinfo is None:
                start_time = timezone.make_aware(start_time)
            
            if end_time.tzinfo is None:
                end_time = timezone.make_aware(end_time)

            if start_time >= end_time:
                raise ValidationError("Start time must be before end time")
        
        # Validate description contains meaningful content
        if self.description and not self.description.strip():
            raise ValidationError("Description cannot be empty or only whitespace")
    @property
    def duration_display(self):
        hours, remainder = divmod(self.duration_seconds, 3600)
        minutes, seconds = divmod(remainder, 60)
        return f"{hours:02d}:{minutes:02d}:{seconds:02d}"
    
    def __str__(self):
        return f"TimeEntry: {self.description[:50]}... ({self.duration_display})"


class TrackerSession(Document):
    user = ReferenceField(User, required=True, unique=True, reverse_delete_rule=2) 
    
    started_at = DateTimeField(required=True)
   
    paused_at = DateTimeField()
    
    accumulated_seconds = IntField(default=0, min_value=0)
    
    is_running = BooleanField(default=True)
    
    created_at = DateTimeField(default=timezone.now)
    updated_at = DateTimeField(default=timezone.now)
    
    meta = {
        'collection': 'tracker_sessions',
        'indexes': [
            'user',
            'is_running',
            'started_at'
        ]
    }
    
    def get_current_elapsed_seconds(self):
       
        total = self.accumulated_seconds
        
        if self.is_running and self.started_at:
            if self.paused_at:

                pause_time = self.paused_at
                start_time = self.started_at
                
                if pause_time.tzinfo is None:
                    pause_time = timezone.make_aware(pause_time)
                if start_time.tzinfo is None:
                    start_time = timezone.make_aware(start_time)
                current_session = (self.paused_at - self.started_at).total_seconds()
            else:
                now = timezone.now()
                start_time = self.started_at
                if start_time.tzinfo is None:
                    start_time = timezone.make_aware(start_time)

                current_session = (now - start_time).total_seconds()
            
            total += int(current_session)
        
        return max(0, total)  
    
    def pause(self):

        if self.is_running and not self.paused_at:
            self.paused_at = timezone.now()
            self.is_running = False
            
            if self.started_at:
                start_time = self.started_at
                pause_time = self.paused_at
                
                if start_time.tzinfo is None:
                    start_time = timezone.make_aware(start_time)

                session_seconds = (pause_time - start_time).total_seconds()
                self.accumulated_seconds += int(session_seconds)
            self.updated_at = timezone.now()
    
    def resume(self):

        if not self.is_running:
            self.started_at = timezone.now()
            self.paused_at = None
            self.is_running = True
            self.updated_at = timezone.now()
    
    def reset(self):
        self.started_at = timezone.now()
        self.paused_at = None
        self.accumulated_seconds = 0
        self.is_running = False
        self.updated_at = timezone.now()
    
    def clean(self):
        self.updated_at = timezone.now()
      
        if self.paused_at and self.started_at:
            pause_time = self.paused_at
            start_time = self.started_at
            
            if pause_time.tzinfo is None:
                pause_time = timezone.make_aware(pause_time)
            if start_time.tzinfo is None:
                start_time = timezone.make_aware(start_time)
                
            if pause_time < start_time:
                raise ValidationError("Pause time cannot be before start time")
    
    def __str__(self):
        status = "Running" if self.is_running else "Paused"
        elapsed = self.get_current_elapsed_seconds()
        hours, remainder = divmod(elapsed, 3600)
        minutes, seconds = divmod(remainder, 60)
        return f"Tracker ({status}): {hours:02d}:{minutes:02d}:{seconds:02d}"