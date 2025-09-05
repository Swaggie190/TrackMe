import os
import sys
import django
from datetime import datetime, timedelta
import random

sys.path.append('/app')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'trackme_backend.settings')
django.setup()

from backend.timetracking.models import User, TimeEntry, TrackerSession

def create_sample_user():
    """Create a sample user for testing"""
    print(" Creating sample user...")

    try:
        user = User.objects.get(email='demo@trackme.com')
        print(f" Sample user already exists: {user.email}")
        return user
    except User.DoesNotExist:
        pass

    user = User(
        email='demo@trackme.com',
        display_name='Demo User',
    )
    user.set_password('demo@123')  
    user.save()
    
    print(f" Created sample user: {user.email}")
    print(f"   Display Name: {user.display_name}")
    print(f"   Password: demo@123")
    
    return user

def create_sample_time_entries(user, count=10):
    """Create sample time entries for the user"""
    print(f"\n Creating {count} sample time entries...")

    existing_count = TimeEntry.objects(user=user).count()
    if existing_count >= count:
        print(f" Sample time entries already exist ({existing_count} entries)")
        return

    projects = [
        {'name': 'TrackMe App', 'tasks': [
            'Implemented user authentication',
            'Created time tracking API',
            'Built React frontend components',
            'Fixed authentication bugs',
            'Added time entry validation',
            'Improved UI/UX design'
        ]},
        {'name': 'Client Website', 'tasks': [
            'Homepage design updates',
            'Contact form implementation',
            'Mobile responsiveness fixes',
            'SEO optimization'
        ]},
        {'name': 'Database Migration', 'tasks': [
            'Schema design planning',
            'Data migration scripts',
            'Performance optimization'
        ]},
        {'name': 'Code Review', 'tasks': [
            'Frontend code review',
            'Backend security audit',
            'Documentation updates'
        ]}
    ]

    entries_created = 0
    base_date = datetime.utcnow() - timedelta(days=30)  
    
    for i in range(count):

        project = random.choice(projects)
        task = random.choice(project['tasks'])
 
        duration_minutes = random.randint(15, 240)
        duration_seconds = duration_minutes * 60

        days_offset = random.randint(0, 29)
        hour_offset = random.randint(9, 17)  
        minute_offset = random.randint(0, 59)
        
        end_time = base_date + timedelta(
            days=days_offset,
            hours=hour_offset,
            minutes=minute_offset
        )
        
        start_time = end_time - timedelta(seconds=duration_seconds)
        
        booked_from_tracker = random.random() < 0.7

        time_entry = TimeEntry(
            user=user,
            description=f"{project['name']}: {task}",
            duration_seconds=duration_seconds,
            start_time=start_time if booked_from_tracker else None,
            end_time=end_time,
            booked_from_tracker=booked_from_tracker,
            metadata={
                'project': project['name'],
                'category': 'development' if 'TrackMe' in project['name'] else 'client_work',
                'priority': random.choice(['low', 'medium', 'high']),
                'billable': random.choice([True, False])
            }
        )
        
        try:
            time_entry.save()
            entries_created += 1
 
            hours, remainder = divmod(duration_seconds, 3600)
            minutes, _ = divmod(remainder, 60)
            duration_display = f"{hours}h {minutes}m"
            
            print(f"   Entry {entries_created}: {task[:30]}... ({duration_display})")
            
        except Exception as e:
            print(f"   Failed to create entry {i+1}: {str(e)}")
    
    print(f"\n Created {entries_created} time entries successfully!")

def create_sample_tracker_session(user):
    """Create a sample tracker session (not running)"""
    print("\n Setting up tracker session...")

    try:
        tracker = TrackerSession.objects.get(user=user)
        print(f" Tracker session already exists for user")
        return tracker
    except TrackerSession.DoesNotExist:
        pass
    
    tracker = TrackerSession(
        user=user,
        started_at=datetime.utcnow(),
        accumulated_seconds=0,
        is_running=False
    )
    tracker.save()
    
    print(f" Created tracker session for user: {user.email}")
    return tracker

def print_summary(user):
    """Print a summary of created data"""
    print("\n" + "="*60)
    print(" INITIALIZATION SUMMARY")
    print("="*60)
    
    # User info
    print(f" User: {user.email} ({user.display_name})")
    print(f" Password: demo123")
    
    # Time entries info
    entries = TimeEntry.objects(user=user)
    total_seconds = sum(entry.duration_seconds for entry in entries)
    hours, remainder = divmod(total_seconds, 3600)
    minutes, _ = divmod(remainder, 60)
    
    print(f" Time Entries: {entries.count()}")
    print(f" Total Time Tracked: {hours}h {minutes}m")
    
    # Project breakdown
    project_totals = {}
    for entry in entries:
        project = entry.metadata.get('project', 'Unknown')
        project_totals[project] = project_totals.get(project, 0) + entry.duration_seconds
    
    print(f"\n Time by Project:")
    for project, seconds in project_totals.items():
        hours, remainder = divmod(seconds, 3600)
        minutes, _ = divmod(remainder, 60)
        print(f"   • {project}: {hours}h {minutes}m")
    
    print("\n Ready to start! You can now:")
    print("   1. Login with: demo@trackme.com / demo@123")
    print("   2. View existing time entries")
    print("   3. Start tracking new time")
    print("   4. Create manual time entries")
    print("="*60)

def main():
    """Main initialization function"""
    print(" TrackMe Database Initialization")
    print("="*60)
    
    try:
        user = create_sample_user()

        create_sample_time_entries(user, count=10)

        create_sample_tracker_session(user)

        print_summary(user)
        
        print("\n Database initialization completed successfully!")
        
    except Exception as e:
        print(f"\n Database initialization failed: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()