// MongoDB initialization script for Smart Helpdesk
db = db.getSiblingDB('smart_helpdesk');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'email', 'password_hash', 'role'],
      properties: {
        name: { bsonType: 'string' },
        email: { bsonType: 'string' },
        password_hash: { bsonType: 'string' },
        role: { enum: ['admin', 'agent', 'user'] }
      }
    }
  }
});

db.createCollection('articles', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['title', 'body', 'status', 'createdBy'],
      properties: {
        title: { bsonType: 'string' },
        body: { bsonType: 'string' },
        tags: { bsonType: 'array', items: { bsonType: 'string' } },
        status: { enum: ['draft', 'published'] }
      }
    }
  }
});

db.createCollection('tickets', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['title', 'description', 'status', 'createdBy'],
      properties: {
        title: { bsonType: 'string' },
        description: { bsonType: 'string' },
        category: { enum: ['billing', 'tech', 'shipping', 'other'] },
        status: { enum: ['open', 'triaged', 'waiting_human', 'resolved', 'closed'] }
      }
    }
  }
});

// Create indexes for performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });

db.articles.createIndex({ title: 'text', body: 'text', tags: 'text' });
db.articles.createIndex({ status: 1 });
db.articles.createIndex({ createdBy: 1 });

db.tickets.createIndex({ createdBy: 1 });
db.tickets.createIndex({ assignee: 1 });
db.tickets.createIndex({ status: 1 });
db.tickets.createIndex({ category: 1 });
db.tickets.createIndex({ createdAt: -1 });

db.agentsuggestions.createIndex({ ticketId: 1 });
db.agentsuggestions.createIndex({ createdAt: -1 });

db.auditlogs.createIndex({ ticketId: 1 });
db.auditlogs.createIndex({ traceId: 1 });
db.auditlogs.createIndex({ timestamp: -1 });

// Config collection (system configuration)
db.createCollection('configs', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: [
        'autoCloseEnabled',
        'confidenceThreshold',
        'slaHours',
        'emailNotificationsEnabled',
        'maxAttachmentSize',
        'allowedAttachmentTypes',
        'updatedBy'
      ],
      properties: {
        autoCloseEnabled: { bsonType: 'bool' },
        confidenceThreshold: { bsonType: 'double', minimum: 0, maximum: 1 },
        slaHours: { bsonType: 'int', minimum: 1 },
        emailNotificationsEnabled: { bsonType: 'bool' },
        maxAttachmentSize: { bsonType: 'int', minimum: 0 },
        allowedAttachmentTypes: { bsonType: 'array', items: { bsonType: 'string' } },
        updatedBy: { bsonType: 'objectId' }
      }
    }
  }
});

db.configs.createIndex({ updatedAt: -1 });
db.configs.createIndex({ updatedBy: 1, updatedAt: -1 });

// Initialize users after database setup
print('🔧 Starting MongoDB user initialization...');

// Check if users already exist to prevent duplicate initialization
const existingUsers = db.users.countDocuments();
if (existingUsers > 0) {
  print('⚠️  Users already exist, skipping user initialization...');
} else {
  print('📝 Creating initial users...');

  // Define the users to create
  const users = [
    {
      _id: ObjectId(),
      name: 'Admin User',
      email: 'admin@smarthelpdesk.com',
      password: 'admin123', // Will be hashed by the application
      role: 'admin',
      isActive: true,
      profile: {
        firstName: 'Admin',
        lastName: 'User',
        phone: '',
        department: 'Administration'
      },
      permissions: {
        canManageUsers: true,
        canManageSystem: true,
        canViewAllTickets: true,
        canManageKnowledgeBase: true,
        canViewReports: true,
        canManageAgents: true
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null
    },
    {
      _id: ObjectId(),
      name: 'John Agent',
      email: 'john.agent@smarthelpdesk.com',
      password: 'agent123', // Will be hashed by the application
      role: 'agent',
      isActive: true,
      profile: {
        firstName: 'John',
        lastName: 'Agent',
        phone: '+1-555-0101',
        department: 'Support'
      },
      permissions: {
        canManageUsers: false,
        canManageSystem: false,
        canViewAllTickets: true,
        canManageKnowledgeBase: true,
        canViewReports: true,
        canManageAgents: false
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null
    },
    {
      _id: ObjectId(),
      name: 'Mike Customer',
      email: 'mike.customer@example.com',
      password: 'user123', // Will be hashed by the application
      role: 'user',
      isActive: true,
      profile: {
        firstName: 'Mike',
        lastName: 'Customer',
        phone: '+1-555-0201',
        department: ''
      },
      permissions: {
        canManageUsers: false,
        canManageSystem: false,
        canViewAllTickets: false,
        canManageKnowledgeBase: false,
        canViewReports: false,
        canManageAgents: false
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null
    },
    {
      _id: ObjectId(),
      name: 'John Customer',
      email: 'john.customer@example.com',
      password: 'user456', // Will be hashed by the application
      role: 'user',
      isActive: true,
      profile: {
        firstName: 'John',
        lastName: 'Customer',
        phone: '+1-555-0202',
        department: ''
      },
      permissions: {
        canManageUsers: false,
        canManageSystem: false,
        canViewAllTickets: false,
        canManageKnowledgeBase: false,
        canViewReports: false,
        canManageAgents: false
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null
    }
  ];

  try {
    // Insert all users
    const result = db.users.insertMany(users);
    
    print('✅ Successfully created ' + result.insertedIds.length + ' users:');
    
    // Log created users (without passwords)
    users.forEach(user => {
      print('   - ' + user.name + ' (' + user.email + ') - Role: ' + user.role);
    });

    // Create a system configuration document with admin user as creator
    const adminUserId = users[0]._id;
    
    const defaultConfig = {
      _id: ObjectId(),
      autoCloseEnabled: true,
      confidenceThreshold: 0.8,
      slaHours: 24,
      emailNotificationsEnabled: true,
      maxAttachmentSize: 10485760, // 10MB
      allowedAttachmentTypes: ['.txt', '.md', '.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.gif'],
      updatedBy: adminUserId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Check if config already exists
    const existingConfig = db.configs.countDocuments();
    if (existingConfig === 0) {
      db.configs.insertOne(defaultConfig);
      print('✅ Created default system configuration');
    }

    // Create user access summary
    print('\n📋 User Access Summary:');
    print('┌────────────────────────────────────────────────────────────────┐');
    print('│ Role     │ Email                          │ Access Level          │');
    print('├────────────────────────────────────────────────────────────────┤');
    print('│ Admin    │ admin@smarthelpdesk.com        │ Full system access    │');
    print('│ Agent    │ john.agent@smarthelpdesk.com   │ Ticket management     │');
    print('│ Customer │ mike.customer@example.com      │ Create/view tickets   │');
    print('│ Customer │ john.customer@example.com      │ Create/view tickets   │');
    print('└────────────────────────────────────────────────────────────────┘');

    print('\n🔐 Default Passwords:');
    print('   Admin:     admin123');
    print('   Agent:     agent123');
    print('   Customer1: user123');
    print('   Customer2: user456');
    print('\n⚠️  Remember to change default passwords in production!');

  } catch (error) {
    print('❌ Error creating users: ' + error.message);
    throw error;
  }
}

print('🎉 Smart Helpdesk database and users initialized successfully!');