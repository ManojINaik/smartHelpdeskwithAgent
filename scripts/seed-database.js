#!/usr/bin/env node

/**
 * Database Seed Script for Smart Helpdesk
 * 
 * This script populates the database with sample data for development and testing.
 * Run with: node scripts/seed-database.js
 */

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/smart_helpdesk?authSource=admin';
const SAMPLE_DATA_SIZE = process.env.SAMPLE_DATA_SIZE || 50;

// Sample data
const sampleUsers = [
  {
    name: 'Admin User',
    email: 'admin@smarthelpdesk.com',
    password_hash: bcrypt.hashSync('admin123', 10),
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'John Agent',
    email: 'john.agent@smarthelpdesk.com',
    password_hash: bcrypt.hashSync('agent123', 10),
    role: 'agent',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Sarah Agent',
    email: 'sarah.agent@smarthelpdesk.com',
    password_hash: bcrypt.hashSync('agent123', 10),
    role: 'agent',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Mike Customer',
    email: 'mike.customer@example.com',
    password_hash: bcrypt.hashSync('user123', 10),
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Lisa Customer',
    email: 'lisa.customer@example.com',
    password_hash: bcrypt.hashSync('user123', 10),
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const sampleArticles = [
  {
    title: 'How to Reset Your Password',
    body: 'If you\'ve forgotten your password, follow these steps:\n\n1. Click on the "Forgot Password" link\n2. Enter your email address\n3. Check your email for a reset link\n4. Click the link and enter a new password\n\nIf you continue to have issues, please contact support.',
    tags: ['password', 'account', 'security'],
    status: 'published',
    createdBy: null, // Will be set to admin user ID
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: 'Billing FAQ',
    body: 'Common billing questions and answers:\n\n**When will I be charged?**\nCharges are processed on the 1st of each month.\n\n**How do I update my payment method?**\nGo to Account Settings > Billing to update your payment information.\n\n**Can I get a refund?**\nRefunds are processed within 5-7 business days.',
    tags: ['billing', 'payment', 'faq'],
    status: 'published',
    createdBy: null,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: 'API Integration Guide',
    body: 'Our API allows you to integrate our helpdesk system with your existing applications.\n\n**Authentication**\nUse Bearer token authentication with your API key.\n\n**Rate Limits**\n100 requests per minute per API key.\n\n**Endpoints**\n- POST /api/tickets - Create a ticket\n- GET /api/tickets - List tickets\n- PUT /api/tickets/:id - Update ticket',
    tags: ['api', 'integration', 'developer'],
    status: 'published',
    createdBy: null,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: 'System Maintenance Schedule',
    body: 'Regular maintenance is performed to ensure optimal system performance.\n\n**Weekly Maintenance**\nEvery Sunday at 2:00 AM UTC\n- Database optimization\n- Log cleanup\n- Security updates\n\n**Monthly Maintenance**\nFirst Sunday of each month\n- Full system backup\n- Performance analysis\n- Feature updates',
    tags: ['maintenance', 'system', 'schedule'],
    status: 'published',
    createdBy: null,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const sampleTickets = [
  {
    title: 'Cannot access my account',
    description: 'I\'m trying to log in but I keep getting an error message saying my credentials are invalid. I\'m sure I\'m using the correct email and password.',
    category: 'tech',
    status: 'open',
    priority: 'medium',
    createdBy: null, // Will be set to user ID
    assignee: null,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: 'Billing question about last month\'s charge',
    description: 'I noticed an unexpected charge on my credit card statement. The amount is $29.99 and it\'s from your company. I don\'t recall upgrading my plan.',
    category: 'billing',
    status: 'triaged',
    priority: 'high',
    createdBy: null,
    assignee: null,
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
    updatedAt: new Date()
  },
  {
    title: 'Feature request: Dark mode',
    description: 'I would love to see a dark mode option for the interface. This would be especially helpful for users who work in low-light environments.',
    category: 'other',
    status: 'waiting_human',
    priority: 'low',
    createdBy: null,
    assignee: null,
    createdAt: new Date(Date.now() - 172800000), // 2 days ago
    updatedAt: new Date()
  },
  {
    title: 'API rate limit exceeded',
    description: 'I\'m getting a 429 error when making API calls. I thought the limit was 100 requests per minute, but I\'m only making about 50 calls.',
    category: 'tech',
    status: 'resolved',
    priority: 'medium',
    createdBy: null,
    assignee: null,
    createdAt: new Date(Date.now() - 259200000), // 3 days ago
    updatedAt: new Date()
  }
];

const sampleConfigs = [
  {
    autoCloseEnabled: true,
    confidenceThreshold: 0.8,
    slaHours: 24,
    emailNotificationsEnabled: true,
    maxAttachmentSize: 10485760, // 10MB
    allowedAttachmentTypes: ['.txt', '.md', '.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg'],
    updatedBy: null, // Will be set to admin user ID
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const sampleAgentSuggestions = [
  {
    ticketId: null, // Will be set to actual ticket ID
    suggestion: 'Based on the user\'s description, this appears to be a password reset issue. I recommend:\n\n1. Verify the user\'s email address\n2. Send password reset instructions\n3. Follow up in 24 hours if not resolved',
    confidence: 0.85,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    ticketId: null,
    suggestion: 'This billing inquiry requires:\n\n1. Review of the user\'s account history\n2. Verification of the charge amount\n3. Explanation of the billing cycle\n4. Option to provide refund if appropriate',
    confidence: 0.92,
    status: 'approved',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const sampleAuditLogs = [
  {
    ticketId: null, // Will be set to actual ticket ID
    action: 'ticket_created',
    userId: null, // Will be set to user ID
    details: 'Ticket created via web interface',
    traceId: 'trace-123456789',
    timestamp: new Date()
  },
  {
    ticketId: null,
    action: 'ticket_triaged',
    userId: null,
    details: 'Ticket automatically triaged by AI system',
    traceId: 'trace-123456789',
    timestamp: new Date()
  }
];

async function seedDatabase() {
  let client;
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db();
    console.log('✅ Connected to database');
    
    // Clear existing data (optional - comment out for production)
    console.log('🧹 Clearing existing data...');
    await db.collection('users').deleteMany({});
    await db.collection('articles').deleteMany({});
    await db.collection('tickets').deleteMany({});
    await db.collection('configs').deleteMany({});
    await db.collection('agentsuggestions').deleteMany({});
    await db.collection('auditlogs').deleteMany({});
    
    // Insert users
    console.log('👥 Inserting users...');
    const userResult = await db.collection('users').insertMany(sampleUsers);
    const userIds = Object.values(userResult.insertedIds);
    const adminUserId = userIds[0]; // First user is admin
    const agentUserIds = userIds.slice(1, 3); // Next two are agents
    const customerUserIds = userIds.slice(3); // Rest are customers
    
    // Update articles with admin user ID
    const articlesWithUser = sampleArticles.map(article => ({
      ...article,
      createdBy: adminUserId
    }));
    
    console.log('📚 Inserting articles...');
    const articleResult = await db.collection('articles').insertMany(articlesWithUser);
    
    // Update tickets with user IDs
    const ticketsWithUsers = sampleTickets.map((ticket, index) => ({
      ...ticket,
      createdBy: customerUserIds[index % customerUserIds.length],
      assignee: index < 2 ? agentUserIds[index % agentUserIds.length] : null
    }));
    
    console.log('🎫 Inserting tickets...');
    const ticketResult = await db.collection('tickets').insertMany(ticketsWithUsers);
    const ticketIds = Object.values(ticketResult.insertedIds);
    
    // Update configs with admin user ID
    const configsWithUser = sampleConfigs.map(config => ({
      ...config,
      updatedBy: adminUserId
    }));
    
    console.log('⚙️ Inserting configurations...');
    await db.collection('configs').insertMany(configsWithUser);
    
    // Update agent suggestions with ticket IDs
    const suggestionsWithTickets = sampleAgentSuggestions.map((suggestion, index) => ({
      ...suggestion,
      ticketId: ticketIds[index % ticketIds.length]
    }));
    
    console.log('🤖 Inserting agent suggestions...');
    await db.collection('agentsuggestions').insertMany(suggestionsWithTickets);
    
    // Update audit logs with ticket and user IDs
    const auditLogsWithIds = sampleAuditLogs.map((log, index) => ({
      ...log,
      ticketId: ticketIds[index % ticketIds.length],
      userId: customerUserIds[index % customerUserIds.length]
    }));
    
    console.log('📋 Inserting audit logs...');
    await db.collection('auditlogs').insertMany(auditLogsWithIds);
    
    // Generate additional sample data
    console.log(`🔄 Generating ${SAMPLE_DATA_SIZE} additional sample tickets...`);
    const additionalTickets = [];
    const categories = ['billing', 'tech', 'shipping', 'other'];
    const statuses = ['open', 'triaged', 'waiting_human', 'resolved', 'closed'];
    const priorities = ['low', 'medium', 'high'];
    
    for (let i = 0; i < SAMPLE_DATA_SIZE; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const createdAt = new Date(Date.now() - (daysAgo * 86400000));
      
      additionalTickets.push({
        title: `Sample Ticket ${i + 1}`,
        description: `This is a sample ticket for testing purposes. Ticket number ${i + 1}.`,
        category: categories[Math.floor(Math.random() * categories.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        createdBy: customerUserIds[Math.floor(Math.random() * customerUserIds.length)],
        assignee: Math.random() > 0.5 ? agentUserIds[Math.floor(Math.random() * agentUserIds.length)] : null,
        createdAt,
        updatedAt: createdAt
      });
    }
    
    await db.collection('tickets').insertMany(additionalTickets);
    
    console.log('✅ Database seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Users: ${sampleUsers.length}`);
    console.log(`   - Articles: ${sampleArticles.length}`);
    console.log(`   - Tickets: ${sampleTickets.length + SAMPLE_DATA_SIZE}`);
    console.log(`   - Configurations: ${sampleConfigs.length}`);
    console.log(`   - Agent Suggestions: ${sampleAgentSuggestions.length}`);
    console.log(`   - Audit Logs: ${sampleAuditLogs.length}`);
    
    console.log('\n🔑 Default login credentials:');
    console.log('   Admin: admin@smarthelpdesk.com / admin123');
    console.log('   Agent: john.agent@smarthelpdesk.com / agent123');
    console.log('   User: mike.customer@example.com / user123');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Run the seed function
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
