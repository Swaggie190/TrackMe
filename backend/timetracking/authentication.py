from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth.models import AnonymousUser
from .models import User
import jwt
from django.conf import settings


class MongoEngineJWTAuthentication(JWTAuthentication):
    
    def get_user(self, validated_token):
    
        try:
            user_email = validated_token.get('user_id') or validated_token.get('email')
            
            if not user_email:
                raw_token = str(validated_token.token)
                decoded = jwt.decode(raw_token, options={"verify_signature": False})
                user_email = decoded.get('email') or decoded.get('user_id')
            
            if not user_email:
                return None
                
            user = User.objects.get(email=user_email)
            return MongoEngineUserWrapper(user)
            
        except User.DoesNotExist:
            return None
        except (KeyError, TokenError):
            return None


class MongoEngineUserWrapper:
    
    def __init__(self, mongoengine_user):
        self.mongoengine_user = mongoengine_user
    
    @property
    def pk(self):
        return str(self.mongoengine_user.id)
    
    @property
    def id(self):
        return str(self.mongoengine_user.id)
    
    @property
    def username(self):
        return self.mongoengine_user.email
    
    @property
    def email(self):
        return self.mongoengine_user.email
    
    @property
    def is_authenticated(self):
        return True
    
    @property
    def is_anonymous(self):
        return False
    
    @property
    def is_active(self):
        return True 
    
    @property
    def is_staff(self):
        return False 
    
    @property
    def is_superuser(self):
        return False  
    
    def __str__(self):
        return self.mongoengine_user.email
    
    def has_perm(self, perm, obj=None):
        return False  
    
    def has_perms(self, perm_list, obj=None):
        return False
    
    def has_module_perms(self, package_name):
        return False
    
    def get_username(self):
        return self.username


from rest_framework_simplejwt.tokens import RefreshToken

class MongoEngineRefreshToken(RefreshToken):
    
    @classmethod
    def for_user(cls, user):
        token = cls()
        token['user_id'] = user.email
        token['email'] = user.email
        return token

RefreshToken.for_user = MongoEngineRefreshToken.for_user