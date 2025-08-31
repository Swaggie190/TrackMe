"""
Management command showing advanced MongoEngine features and query patterns
"""
from django.core.management.base import BaseCommand
from timetracking.models import User, TimeEntry, TrackerSession
from datetime import datetime, timedelta
from mongoengine import Q


class Command(BaseCommand):
    help = 'Demonstrate advanced MongoEngine features and query patterns'

    def handle(self, *args, **options):
        self.stdout.write('📚 MongoEngine Advanced Features Demo')
        self.stdout.write('='*50)

        try:
            # Create sample user if doesn't exist
            user, created = self.get_or_create_user()
            if created:
                self.stdout.write(f'✅ Created sample user: {user.email}')
            else:
                self.stdout.write(f'✅ Using existing user: {user.email}')

            # Demonstrate advanced queries
            self.demonstrate_queries(user)
            
            # Demonstrate aggregation
            self.demonstrate_aggregation(user)
            
            # Demonstrate validation
            self.demonstrate_validation()
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Demo failed: {str(e)}'))

    def get_or_create_user(self):
        """Get existing user or create new one"""
        try:
            user = User.objects.get(email='demo@trackme.com')
            return user, False
        except User.DoesNotExist:
            user = User(
                email='demo@trackme.com',
                display_name='Demo User'
            )
            user.set_password('demopassword')
            user.save()
            
            # Create some sample time entries
            for i in range(5):
                entry = TimeEntry(
                    user=user,
                    description=f'Sample task #{i+1} - {"Bug fix" if i % 2 == 0 else "Feature development"}',
                    duration_seconds=(i+1) * 1800,  # 30min, 1hr, 1.5hr, etc.
                    end_time=datetime.utcnow() - timedelta(days=i),
                    booked_from_tracker=i % 2 == 0,
                    metadata={
                        'project': 'TrackMe' if i % 2 == 0 else 'ClientApp',
                        'priority': 'high' if i < 2 else 'medium'
                    }
                )
                entry.save()
            
            return user, True

    def demonstrate_queries(self, user):
        """Show various query patterns"""
        self.stdout.write('\n🔍 Query Patterns Demo:')
        
        # 1. Basic filtering
        all_entries = TimeEntry.objects(user=user)
        self.stdout.write(f'   • Total entries: {all_entries.count()}')
        
        # 2. Field filtering
        tracker_entries = TimeEntry.objects(user=user, booked_from_tracker=True)
        self.stdout.write(f'   • Tracker-booked entries: {tracker_entries.count()}')
        
        # 3. Range queries (last 7 days)
        week_ago = datetime.utcnow() - timedelta(days=7)
        recent_entries = TimeEntry.objects(user=user, end_time__gte=week_ago)
        self.stdout.write(f'   • Entries from last 7 days: {recent_entries.count()}')
        
        # 4. Text search (case-insensitive)
        bug_entries = TimeEntry.objects(user=user, description__icontains='bug')
        self.stdout.write(f'   • Entries containing "bug": {bug_entries.count()}')
        
        # 5. Complex queries with Q objects (OR conditions)
        high_priority_or_long = TimeEntry.objects(
            user=user
        ).filter(
            Q(metadata__priority='high') | Q(duration_seconds__gte=3600)
        )
        self.stdout.write(f'   • High priority OR >1hr entries: {high_priority_or_long.count()}')
        
        # 6. Ordering and limiting
        latest_entries = TimeEntry.objects(user=user).order_by('-end_time').limit(3)
        self.stdout.write(f'   • Latest 3 entries:')
        for entry in latest_entries:
            self.stdout.write(f'     - {entry.description[:30]}... ({entry.duration_display})')

    def demonstrate_aggregation(self, user):
        """Show aggregation patterns"""
        self.stdout.write('\n📊 Aggregation Demo:')
        
        # Calculate total time tracked
        entries = TimeEntry.objects(user=user)
        total_seconds = sum(entry.duration_seconds for entry in entries)
        hours, remainder = divmod(total_seconds, 3600)
        minutes, _ = divmod(remainder, 60)
        
        self.stdout.write(f'   • Total time tracked: {hours}h {minutes}m')
        
        # Group by project (from metadata)
        project_totals = {}
        for entry in entries:
            project = entry.metadata.get('project', 'Unknown')
            project_totals[project] = project_totals.get(project, 0) + entry.duration_seconds
        
        self.stdout.write('   • Time by project:')
        for project, seconds in project_totals.items():
            hours, remainder = divmod(seconds, 3600)
            minutes, _ = divmod(remainder, 60)
            self.stdout.write(f'     - {project}: {hours}h {minutes}m')

    def demonstrate_validation(self):
        """Show validation in action"""
        self.stdout.write('\n✅ Validation Demo:')
        
        try:
            # Try to create invalid user
            invalid_user = User(
                email='not-an-email',  # Invalid email
                display_name='',  # Empty display name
            )
            invalid_user.clean()  # This should raise ValidationError
            self.stdout.write('❌ Validation should have failed!')
            
        except Exception as e:
            self.stdout.write(f'   • Email validation caught: {type(e).__name__}')
        
        try:
            # Try to create time entry with future end_time
            user = User.objects.first()
            future_entry = TimeEntry(
                user=user,
                description='Future task',
                duration_seconds=3600,
                end_time=datetime.utcnow() + timedelta(hours=1)  # Too far in future
            )
            future_entry.clean()
            
        except Exception as e:
            self.stdout.write(f'   • Time validation caught: {e}')
        
        self.stdout.write('   • Validation system working correctly! ✅')

        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS('🎓 Advanced features demo completed!'))