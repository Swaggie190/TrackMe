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


class UserRegistrationView(APIView):
    """
    Handle user registration
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):

        print(f"🔍 Registration request data: {request.data}")
        print(f"🔍 Request content type: {request.content_type}")
     
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
                print(f"🚨 Error creating user: {e}")
                return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            print(f"❌ Serializer validation failed: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserLoginView(APIView):
    """
    Handle user login
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        """
        Authenticate user and return JWT tokens
        """
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
    """
    Handle user profile operations

    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_user_object(self):
        """
        Get user from JWT token
        """

        try:
            user_email = self.request.user.username  
            return User.objects.get(email=user_email)
        except User.DoesNotExist:
            raise Http404("User not found")
    
    def get(self, request):
        """
        Get current user profile
        """
        user = self.get_user_object()
        serializer = UserProfileSerializer(user)
        return Response(serializer.data)
    
    def put(self, request):
        """
        Update user profile
        """
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
    """
    ViewSet for time entries CRUD operations

    """
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
            # Get email from authenticated Django user
            user_email = self.request.user.email
            if not user_email:
                user_email = self.request.user.username
                
            if not user_email:
                raise Http404("No email found for authenticated user")
                
            # Find corresponding MongoEngine user
            return User.objects.get(email=user_email)
            
        except User.DoesNotExist:
            raise Http404("MongoEngine user not found")
        except Exception as e:
            raise Http404(f"User lookup error: {str(e)}")
        
    
    def get_serializer_class(self):
        """
        Use different serializers for different actions
        """
        if self.action == 'create':
            return TimeEntryCreateSerializer
        elif self.action == 'list':
            return TimeEntryListSerializer
        return TimeEntrySerializer
    
    def perform_create(self, serializer):
        """
        Custom create logic to handle tracker booking
        """
        user = self.get_user_object()
        
        if serializer.validated_data.get('booked_from_tracker', False):
            self._book_from_tracker(user, serializer)
        else:
            serializer.save(user=user)
    
    def _book_from_tracker(self, user, serializer):
        """
        Book time from the user's active tracker session
        """
        try:
            tracker = TrackerSession.objects.get(user=user)
            
            # Calculate duration from tracker
            duration_seconds = tracker.get_current_elapsed_seconds()
            
            if duration_seconds <= 0:
                raise ValueError("No time tracked to book")
            
            # Create the time entry
            serializer.save(
                user=user,
                duration_seconds=duration_seconds,
                start_time=tracker.started_at,
                booked_from_tracker=True
            )
            
            # Reset the tracker
            tracker.reset()
            tracker.save()
            
        except TrackerSession.DoesNotExist:
            raise ValueError("No active tracker session found")


class TrackerView(APIView):
    """
    Handle tracker operations: start, pause, resume, reset
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_user_object(self):
        """Helper to get MongoEngine User from JWT"""
        try:
            user_email = self.request.user.username
            return User.objects.get(email=user_email)
        except User.DoesNotExist:
            raise Http404("User not found")
    
    def get_or_create_tracker(self, user):
        """
        Get existing tracker or create new one for user
        """
        try:
            return TrackerSession.objects.get(user=user)
        except TrackerSession.DoesNotExist:
            tracker = TrackerSession(
                user=user,
                started_at=datetime.utcnow(),
                is_running=False
            )
            tracker.save()
            return tracker
    
    def get(self, request):
        """
        Get current tracker status
        """
        user = self.get_user_object()
        tracker = self.get_or_create_tracker(user)
        
        return Response({
            'is_running': tracker.is_running,
            'current_elapsed_seconds': tracker.get_current_elapsed_seconds(),
            'started_at': tracker.started_at,
            'paused_at': tracker.paused_at
        })
    
    def post(self, request):
        """
        Handle tracker actions: start, pause, resume, reset
        """
        user = self.get_user_object()
        tracker = self.get_or_create_tracker(user)
        
        action = request.data.get('action')
        
        if action == 'start':
            if not tracker.is_running:
                tracker.started_at = datetime.utcnow()
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