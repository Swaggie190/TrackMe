from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
from django.contrib.auth.models import User as DjangoUser
from .models import User as MongoUser


class EmailBasedJWTAuthentication(JWTAuthentication):
    """
    Custom JWT authentication that uses email instead of user ID
    """
    
    def get_user(self, validated_token):
        """
        Get Django User from JWT token using email
        """
        try:
            # Get email from the token
            user_email = validated_token.get('email')
            if not user_email:
                raise InvalidToken('Token does not contain email')
            
            # Find or create Django user with this email
            django_user, created = DjangoUser.objects.get_or_create(
                username=user_email,
                defaults={
                    'email': user_email,
                    'is_active': True,
                }
            )
            
            return django_user
            
        except Exception as e:
            raise InvalidToken(f'User authentication failed: {str(e)}')