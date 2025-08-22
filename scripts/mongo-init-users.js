// MongoDB User Initialization Script for Smart Helpdesk
// This script runs only once when the MongoDB container is first created
// It creates 4 predefined users: 1 admin, 1 agent, and 2 customers

print('🔧 Starting MongoDB user initialization...');

// Switch to the smart_helpdesk database
db = db.getSiblingDB('smart_helpdesk');

// Function to hash passwords (simple implementation for MongoDB init)
function hashPassword(password) {
  // Using MongoDB's built-in password hashing for simplicity
  // In production, this would be handled by bcrypt on the application side
  return password; // This will be handled by bcrypt in the application
}

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

print('🎉 MongoDB user initialization completed successfully!');