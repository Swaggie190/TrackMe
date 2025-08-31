"""
Management command to test our MongoDB models
"""
from django.core.management.base import BaseCommand
from timetracking.models import User, TimeEntry, TrackerSession
from datetime import datetime, timedelta


class Command(BaseCommand):
    help = 'Test MongoDB models by creating sample data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--cleanup',
            action='store_true',
            help='Delete all test data before creating new data',
        )

    def handle(self, *args, **options):
        try:
            # Cleanup existing data if requested
            if options['cleanup']:
                self.stdout.write('🧹 Cleaning up existing test data...')
                User.objects.delete()  # This will cascade to related documents
                self.stdout.write(self.style.SUCCESS('✅ Cleanup completed'))

            # Test User model
            self.stdout.write('👤 Testing User model...')
            
            # Create a test user
            user = User(
                email='test@trackme.com',
                display_name='Test User'
            )
            user.set_password('testpassword123')  # This will hash the password
            user.save()
            
            self.stdout.write(f'✅ Created user: {user}')
            self.stdout.write(f'   - ID: {user.id}')
            self.stdout.write(f'   - Password check: {user.check_password("testpassword123")}')
            
            # Test TimeEntry model
            self.stdout.write('\n⏱️  Testing TimeEntry model...')
            
            # Create a manual time entry
            manual_entry = TimeEntry(
                user=user,
                description='Fixed bug in authentication system',
                duration_seconds=3600,  # 1 hour
                end_time=datetime.utcnow(),
                booked_from_tracker=False,
                metadata={'project': 'TrackMe', 'category': 'bug-fix'}
            )
            manual_entry.save()
            
            self.stdout.write(f'✅ Created manual entry: {manual_entry}')
            self.stdout.write(f'   - Duration display: {manual_entry.duration_display}')
            
            # Create a tracker-booked entry
            tracker_entry = TimeEntry(
                user=user,
                description='Implemented user authentication models',
                duration_seconds=5400,  # 1.5 hours
                start_time=datetime.utcnow() - timedelta(seconds=5400),
                end_time=datetime.utcnow(),
                booked_from_tracker=True,
                metadata={'project': 'TrackMe', 'category': 'development'}
            )
            tracker_entry.save()
            
            self.stdout.write(f'✅ Created tracker entry: {tracker_entry}')
            
            # Test TrackerSession model
            self.stdout.write('\n🎯 Testing TrackerSession model...')
            
            # Create a running tracker session
            tracker = TrackerSession(
                user=user,
                started_at=datetime.utcnow() - timedelta(minutes=25),
                accumulated_seconds=1200,  # 20 minutes from previous sessions
                is_running=True
            )
            tracker.save()
            
            self.stdout.write(f'✅ Created tracker session: {tracker}')
            self.stdout.write(f'   - Current elapsed: {tracker.get_current_elapsed_seconds()} seconds')
            
            # Test pause/resume functionality
            self.stdout.write('\n⏸️  Testing pause/resume...')
            tracker.pause()
            tracker.save()
            self.stdout.write(f'⏸️  After pause: {tracker}')
            
            tracker.resume()
            tracker.save()
            self.stdout.write(f'▶️  After resume: {tracker}')
            
            # Query tests
            self.stdout.write('\n🔍 Testing queries...')
            
            # Find user entries
            user_entries = TimeEntry.objects(user=user)
            self.stdout.write(f'✅ Found {user_entries.count()} entries for user')
            
            # Find entries from last 24 hours
            yesterday = datetime.utcnow() - timedelta(days=1)
            recent_entries = TimeEntry.objects(user=user, end_time__gte=yesterday)
            self.stdout.write(f'✅ Found {recent_entries.count()} entries from last 24 hours')
            
            # Search entries by description
            bug_entries = TimeEntry.objects(user=user, description__icontains='bug')
            self.stdout.write(f'✅ Found {bug_entries.count()} entries containing "bug"')
            
            self.stdout.write('\n' + '='*50)
            self.stdout.write(self.style.SUCCESS('🎉 All model tests passed successfully!'))
            self.stdout.write('You can now proceed to create the API endpoints.')
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Model test failed: {str(e)}')
            )
            import traceback
            self.stdout.write(traceback.format_exc())