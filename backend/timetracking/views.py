from rest_framework import status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_mongoengine import viewsets
from rest_framework_simplejwt.tokens import RefreshToken
from django.http import Http404
from datetime import datetime

from .models import User, TimeEntry, TrackerSession
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, UserProfileSerializer,
    TimeEntrySerializer, TimeEntryCreateSerializer, TimeEntryListSerializer,
    TrackerSessionSerializer, TrackerStatusSerializer, TrackerActionSerializer
)
from django.utils import timezone


class UserRegistrationView(APIView):

    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = serializer.save()

                from .tokens import create_tokens_for_mongo_user

                refresh = create_tokens_for_mongo_user(user)
                return Response({
                    'message': 'User created successfully',
                    'user': UserProfileSerializer(user).data,
                    'tokens': {
                        'refresh': str(refresh),
                        'access': str(refresh.access_token),
                    }
                }, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserLoginView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            from .tokens import create_tokens_for_mongo_user
    
            refresh = create_tokens_for_mongo_user(user)
            
            return Response({
                'message': 'Login successful',
                'user': UserProfileSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get_user_object(self):
        try:
            user_email = self.request.user.username  
            return User.objects.get(email=user_email)
        except User.DoesNotExist:
            raise Http404("User not found")
    
    def get(self, request):
        user = self.get_user_object()
        serializer = UserProfileSerializer(user)
        return Response(serializer.data)
    
    def put(self, request):
        user = self.get_user_object()
        serializer = UserProfileSerializer(user, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Profile updated successfully',
                'user': serializer.data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TimeEntryViewSet(viewsets.ModelViewSet):
    serializer_class = TimeEntrySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
   
        user = self.get_user_object()
        queryset = TimeEntry.objects(user=user)
        
        search_query = self.request.query_params.get('q', None)
        if search_query:
            queryset = queryset.filter(description__icontains=search_query)
        
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        
        if start_date:
            try:
                start_datetime = datetime.strptime(start_date, '%Y-%m-%d')
                queryset = queryset.filter(end_time__gte=start_datetime)
            except ValueError:
                pass  
        
        if end_date:
            try:
                end_datetime = datetime.strptime(end_date, '%Y-%m-%d')
                end_datetime = end_datetime.replace(hour=23, minute=59, second=59)
                queryset = queryset.filter(end_time__lte=end_datetime)
            except ValueError:
                pass
        
        return queryset.order_by('-end_time')
    
    def get_user_object(self):
        try:
            user_email = self.request.user.email
            if not user_email:
                user_email = self.request.user.username
                
            if not user_email:
                raise Http404("No email found for authenticated user")
            return User.objects.get(email=user_email)
            
        except User.DoesNotExist:
            raise Http404("MongoEngine user not found")
        except Exception as e:
            raise Http404(f"User lookup error: {str(e)}")
        
    
    def get_serializer_class(self):
        if self.action == 'create':
            return TimeEntryCreateSerializer
        elif self.action == 'list':
            return TimeEntryListSerializer
        return TimeEntrySerializer
    
    def perform_create(self, serializer):

        user = self.get_user_object()
        
        if serializer.validated_data.get('booked_from_tracker', False):
            self._book_from_tracker(user, serializer)
        else:
            serializer.save(user=user)
    
    def _book_from_tracker(self, user, serializer):
        try:
            tracker = TrackerSession.objects.get(user=user)
            duration_seconds = tracker.get_current_elapsed_seconds()
            
            if duration_seconds <= 0:
                raise ValueError("No time tracked to book")
            original_start_time = tracker.started_at
            current_end_time = timezone.now()
            if original_start_time.tzinfo is None:
                original_start_time = timezone.make_aware(original_start_time)
            
            validated_data = serializer.validated_data.copy()

            fields_to_remove = ['end_time', 'booked_from_tracker', 'duration_seconds', 'start_time', 'user']
            for field in fields_to_remove:
                validated_data.pop(field, None) 

            if 'end_time' in validated_data:
                validated_data.pop('end_time')
            
            serializer.save(
                user=user,
                duration_seconds=duration_seconds,
                start_time=original_start_time,
                end_time=current_end_time, 
                booked_from_tracker=True,
                **validated_data 
            )

            tracker.reset()
            tracker.save()
            
        except TrackerSession.DoesNotExist:
            raise ValueError("No active tracker session found")
        except Exception as e:
            raise


class TrackerView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get_user_object(self):
        try:
            user_email = self.request.user.username
            return User.objects.get(email=user_email)
        except User.DoesNotExist:
            raise Http404("User not found")
    
    def get_or_create_tracker(self, user):
        try:
            return TrackerSession.objects.get(user=user)
        except TrackerSession.DoesNotExist:
            tracker = TrackerSession(
                user=user,
                started_at=timezone.now(),
                is_running=False
            )
            tracker.save()
            return tracker
    
    def get(self, request):
        user = self.get_user_object()
        tracker = self.get_or_create_tracker(user)
        
        return Response({
            'is_running': tracker.is_running,
            'current_elapsed_seconds': tracker.get_current_elapsed_seconds(),
            'started_at': tracker.started_at,
            'paused_at': tracker.paused_at
        })
    
    def post(self, request):
        user = self.get_user_object()
        tracker = self.get_or_create_tracker(user)
        
        action = request.data.get('action')
        
        if action == 'start':
            if not tracker.is_running:
                tracker.started_at = timezone.now()
                tracker.paused_at = None
                tracker.is_running = True
                tracker.save()
                message = 'Tracker started'
            else:
                message = 'Tracker already running'
        
        elif action == 'pause':
            if tracker.is_running:
                tracker.pause()
                tracker.save()
                message = 'Tracker paused'
            else:
                message = 'Tracker already paused'
        
        elif action == 'resume':
            if not tracker.is_running:
                tracker.resume()
                tracker.save()
                message = 'Tracker resumed'
            else:
                message = 'Tracker already running'
        
        elif action == 'reset':
            tracker.reset()
            tracker.save()
            message = 'Tracker reset'
        
        else:
            return Response(
                {'error': 'Invalid action. Use: start, pause, resume, reset'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response({
            'message': message,
            'tracker': {
                'is_running': tracker.is_running,
                'current_elapsed_seconds': tracker.get_current_elapsed_seconds(),
                'started_at': tracker.started_at,
                'paused_at': tracker.paused_at
            }
        })