#!/usr/bin/env node

/**
 * MongoDB Atlas Connection Test Script
 * 
 * This script tests connectivity to MongoDB Atlas and provides detailed
 * debugging information for connection issues.
 * 
 * Usage:
 *   node scripts/test-mongodb-connection.js
 * 
 * Make sure to set MONGODB_URI environment variable or update it below.
 */

const { MongoClient } = require('mongodb');

// Get MongoDB URI from environment or set it directly for testing
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/database';

async function testConnection() {
  console.log('🧪 MongoDB Atlas Connection Test');
  console.log('===============================\n');

  // Validate URI format
  console.log('📋 Connection Details:');
  if (MONGODB_URI.includes('mongodb+srv')) {
    console.log('✅ Using MongoDB Atlas (SRV connection)');
  } else {
    console.log('ℹ️  Using standard MongoDB connection');
  }

  const hasDatabase = MONGODB_URI.split('/').length > 3 && MONGODB_URI.split('/')[3].split('?')[0];
  console.log(`📊 Database: ${hasDatabase || 'Not specified'}`);
  
  if (!hasDatabase) {
    console.log('⚠️  Warning: No database name specified in connection string');
  }

  console.log(`🔗 URI Format: ${MONGODB_URI.startsWith('mongodb') ? 'Valid' : 'Invalid'}\n`);

  if (MONGODB_URI === 'mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/database') {
    console.log('❌ Error: Please set MONGODB_URI environment variable or update the script');
    console.log('Example: export MONGODB_URI="mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/mydb"');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    family: 4, // IPv4 only
    retryWrites: true,
    w: 'majority'
  });

  try {
    console.log('🔄 Attempting to connect...');
    
    // Test basic connection
    await client.connect();
    console.log('✅ Successfully connected to MongoDB Atlas!');

    // Test database operations
    const db = client.db();
    console.log(`📊 Connected to database: ${db.databaseName}`);

    // Test a simple operation
    const adminDb = client.db('admin');
    const result = await adminDb.command({ ismaster: 1 });
    console.log('✅ Database ping successful');

    // List collections (if any)
    const collections = await db.listCollections().toArray();
    console.log(`📁 Collections found: ${collections.length}`);
    
    if (collections.length > 0) {
      console.log('   Collections:', collections.map(c => c.name).join(', '));
    }

    console.log('\n🎉 Connection test completed successfully!');
    console.log('Your MongoDB Atlas configuration is working correctly.');

  } catch (error) {
    console.log('\n❌ Connection test failed!');
    console.error('Error:', error.message);
    
    console.log('\n🔍 Troubleshooting steps:');
    console.log('1. Check IP whitelist in MongoDB Atlas:');
    console.log('   - Go to Network Access in Atlas dashboard');
    console.log('   - Add 0.0.0.0/0 to allow all IPs (for testing)');
    console.log('   - Or add your specific IP address');
    
    console.log('\n2. Verify database user credentials:');
    console.log('   - Go to Database Access in Atlas dashboard');
    console.log('   - Ensure user has readWrite permissions');
    console.log('   - Check username and password are correct');
    
    console.log('\n3. Check connection string format:');
    console.log('   - Should be: mongodb+srv://username:password@cluster.xxxxx.mongodb.net/database');
    console.log('   - Encode special characters in password');
    console.log('   - Include database name at the end');
    
    console.log('\n4. Verify cluster status:');
    console.log('   - Check if cluster is paused in Atlas dashboard');
    console.log('   - Ensure cluster is in running state');

    if (error.code) {
      console.log(`\nError code: ${error.code}`);
    }

    process.exit(1);
  } finally {
    await client.close();
  }
}

// Handle unhandled errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

// Run the test
testConnection().catch(console.error);