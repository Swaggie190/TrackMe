"""
Management command to test MongoDB connection
"""
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = 'Test MongoDB connection'

    def handle(self, *args, **options):
        try:
            # Import here to avoid import errors during Django setup
            from mongoengine.connection import get_connection
            import mongoengine
            
            # Test the connection
            connection = get_connection()
            
            # Try to get server info
            server_info = connection.server_info()
            
            self.stdout.write(
                self.style.SUCCESS(
                    '✅ MongoDB connection successful!'
                )
            )
            self.stdout.write(f'MongoDB version: {server_info["version"]}')
            self.stdout.write(f'Connected to: {connection.address[0]}:{connection.address[1]}')
            
        except ImportError as e:
            self.stdout.write(
                self.style.ERROR(
                    f'❌ Import error: {str(e)}'
                )
            )
            self.stdout.write('Make sure mongoengine is installed: pip install mongoengine')
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(
                    f'❌ MongoDB connection failed: {str(e)}'
                )
            )
            self.stdout.write(
                'Make sure MongoDB is running on localhost:27017'
            )