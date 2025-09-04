"""
URL patterns for timetracking app
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    UserRegistrationView, UserLoginView, UserProfileView,
    TimeEntryViewSet, TrackerView
)

# Router for ViewSets
router = DefaultRouter()
router.register(r'time-entries', TimeEntryViewSet, basename='timeentry')

urlpatterns = [
    # Authentication endpoints
    path('auth/register/', UserRegistrationView.as_view(), name='user_register'),
    path('auth/login/', UserLoginView.as_view(), name='user_login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # User profile
    path('users/me/', UserProfileView.as_view(), name='user_profile'),
    
    # Tracker endpoints
    path('tracker/status/', TrackerView.as_view(), name='tracker_status'),
    path('tracker/start/', TrackerView.as_view(), name='tracker_action'),
    path('tracker/pause/', TrackerView.as_view(), name='tracker_action'),
    path('tracker/resume/', TrackerView.as_view(), name='tracker_action'),
    path('tracker/reset/', TrackerView.as_view(), name='tracker_action'),
    
    # Include router URLs (time-entries endpoints)
    path('', include(router.urls)),
]