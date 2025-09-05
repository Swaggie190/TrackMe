db = db.getSiblingDB('trackme_db');

db.createUser({
  user: 'trackme_user',
  pwd: 'trackme_pass',
  roles: [
    {
      role: 'readWrite',
      db: 'trackme_db'
    }
  ]
});

db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'password_hash', 'display_name', 'created_at'],
      properties: {
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          description: 'Must be a valid email address'
        },
        password_hash: {
          bsonType: 'string',
          minLength: 20,
          description: 'Must be a hashed password'
        },
        display_name: {
          bsonType: 'string',
          minLength: 2,
          maxLength: 100,
          description: 'Must be between 2 and 100 characters'
        },
        created_at: {
          bsonType: 'date',
          description: 'Must be a valid date'
        },
        updated_at: {
          bsonType: 'date',
          description: 'Must be a valid date'
        }
      }
    }
  }
});

db.createCollection('time_entry', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['user', 'description', 'duration_seconds', 'end_time'],
      properties: {
        user: {
          bsonType: 'objectId',
          description: 'Must be a valid ObjectId reference to users collection'
        },
        description: {
          bsonType: 'string',
          minLength: 3,
          maxLength: 1000,
          description: 'Must be between 3 and 1000 characters'
        },
        duration_seconds: {
          bsonType: 'int',
          minimum: 1,
          description: 'Must be a positive integer'
        },
        start_time: {
          bsonType: 'date',
          description: 'Must be a valid date'
        },
        end_time: {
          bsonType: 'date',
          description: 'Must be a valid date'
        },
        booked_from_tracker: {
          bsonType: 'bool',
          description: 'Must be a boolean value'
        },
        metadata: {
          bsonType: 'object',
          description: 'Must be an object for additional data'
        }
      }
    }
  }
});

db.createCollection('tracker_session', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['user', 'started_at'],
      properties: {
        user: {
          bsonType: 'objectId',
          description: 'Must be a valid ObjectId reference to users collection'
        },
        started_at: {
          bsonType: 'date',
          description: 'Must be a valid date'
        },
        paused_at: {
          bsonType: 'date',
          description: 'Must be a valid date'
        },
        accumulated_seconds: {
          bsonType: 'int',
          minimum: 0,
          description: 'Must be a non-negative integer'
        },
        is_running: {
          bsonType: 'bool',
          description: 'Must be a boolean value'
        }
      }
    }
  }
});

db.users.createIndex({ 'email': 1 }, { unique: true });
db.users.createIndex({ 'created_at': 1 });

db.time_entry.createIndex({ 'user': 1 });
db.time_entry.createIndex({ 'user': 1, 'end_time': -1 });
db.time_entry.createIndex({ 'user': 1, 'description': 'text' });
db.time_entry.createIndex({ 'end_time': -1 });

db.tracker_session.createIndex({ 'user': 1 }, { unique: true });

print('MongoDB initialization completed successfully!');
print('Created database: trackme_db');
print('Created user: trackme_user');
print('Created collections: users, time_entry, tracker_session');
print('Created indexes for performance optimization');