from rest_framework_simplejwt.tokens import RefreshToken


def create_tokens_for_mongo_user(mongo_user):
    """
    Create JWT tokens for MongoEngine User using email
    """
    # Create or get Django user
    from django.contrib.auth.models import User as DjangoUser
    django_user, created = DjangoUser.objects.get_or_create(
        username=mongo_user.email,
        defaults={
            'email': mongo_user.email,
            'is_active': True,
        }
    )
    
    # Create token and add email to payload
    refresh = RefreshToken.for_user(django_user)
    refresh['email'] = mongo_user.email  # Add email to token payload
    
    return refresh