#!/usr/bin/env node

/**
 * MongoDB User Reset Script for Smart Helpdesk
 * 
 * This script removes all existing users and reinitializes them with default values.
 * Use with caution - this will delete ALL user data!
 * 
 * Usage:
 *   node scripts/reset-users.js
 *   docker exec -it smart-helpdesk-mongodb mongosh -u admin -p password --authenticationDatabase admin < scripts/reset-users.js
 */

const { MongoClient } = require('mongodb');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:password@mongodb:27017/smart_helpdesk?authSource=admin';

async function resetUsers() {
  console.log('🔄 Starting user reset process...');
  
  let client;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db('smart_helpdesk');
    
    console.log('📊 Current user count:', await db.collection('users').countDocuments());
    
    // Ask for confirmation in interactive mode
    if (process.stdout.isTTY) {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        rl.question('⚠️  This will DELETE ALL USERS. Continue? (yes/no): ', resolve);
      });
      
      rl.close();
      
      if (answer.toLowerCase() !== 'yes') {
        console.log('❌ Operation cancelled.');
        return;
      }
    }
    
    // Remove all existing users
    console.log('🗑️  Removing existing users...');
    const deleteResult = await db.collection('users').deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} users`);
    
    // Remove existing configs
    console.log('🗑️  Removing existing configurations...');
    const configDeleteResult = await db.collection('configs').deleteMany({});
    console.log(`✅ Deleted ${configDeleteResult.deletedCount} configurations`);
    
    // Recreate default users
    console.log('👤 Creating default users...');
    
    const users = [
      {
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
    
    // Insert users
    const insertResult = await db.collection('users').insertMany(users);
    console.log(`✅ Created ${insertResult.insertedCount} users`);
    
    // Create default configuration with admin user
    const adminUserId = insertResult.insertedIds[0];
    
    const defaultConfig = {
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
    
    await db.collection('configs').insertOne(defaultConfig);
    console.log('✅ Created default system configuration');
    
    // Display summary
    console.log('\n📋 Reset Summary:');
    console.log('┌────────────────────────────────────────────────────────────────┐');
    console.log('│ Role     │ Email                          │ Password         │');
    console.log('├────────────────────────────────────────────────────────────────┤');
    console.log('│ Admin    │ admin@smarthelpdesk.com        │ admin123         │');
    console.log('│ Agent    │ john.agent@smarthelpdesk.com   │ agent123         │');
    console.log('│ Customer │ mike.customer@example.com      │ user123          │');
    console.log('│ Customer │ john.customer@example.com      │ user456          │');
    console.log('└────────────────────────────────────────────────────────────────┘');
    
    console.log('\n🎉 User reset completed successfully!');
    console.log('⚠️  Remember to change default passwords in production!');
    
  } catch (error) {
    console.error('❌ Error during user reset:', error.message);
    throw error;
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Run the reset if this script is executed directly
if (require.main === module) {
  resetUsers().catch(console.error);
}

module.exports = { resetUsers };