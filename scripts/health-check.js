#!/usr/bin/env node

/**
 * Health Check Script for Smart Helpdesk
 * 
 * This script verifies that all services are running correctly
 * Run with: node scripts/health-check.js
 */

const http = require('http');
const { MongoClient } = require('mongodb');

// Configuration
const SERVICES = {
  frontend: { url: 'http://localhost:5173', name: 'Frontend (React)' },
  backend: { url: 'http://localhost:3000/health', name: 'Backend API' },
  bullmq: { url: 'http://localhost:3001', name: 'BullMQ Dashboard' }
};

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/smart_helpdesk?authSource=admin';

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function colorize(text, color) {
  return `${colors[color] || ''}${text}${colors.reset}`;
}

async function checkService(name, url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? require('https') : http;
    const request = protocol.get(url, (res) => {
      const success = res.statusCode >= 200 && res.statusCode < 400;
      resolve({
        name,
        url,
        status: success ? 'healthy' : 'unhealthy',
        statusCode: res.statusCode,
        success
      });
    });

    request.on('error', (error) => {
      resolve({
        name,
        url,
        status: 'error',
        error: error.message,
        success: false
      });
    });

    request.setTimeout(5000, () => {
      request.destroy();
      resolve({
        name,
        url,
        status: 'timeout',
        error: 'Request timeout',
        success: false
      });
    });
  });
}

async function checkMongoDB() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    // Test database operations
    const db = client.db();
    await db.admin().ping();
    
    // Check collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    await client.close();
    
    return {
      name: 'MongoDB Database',
      status: 'healthy',
      collections: collectionNames.length,
      collectionNames: collectionNames.slice(0, 5), // Show first 5
      success: true
    };
  } catch (error) {
    return {
      name: 'MongoDB Database',
      status: 'error',
      error: error.message,
      success: false
    };
  }
}

async function checkRedis() {
  // Simple Redis check via HTTP (since we don't have redis client here)
  // This is a basic connectivity test
  return new Promise((resolve) => {
    const net = require('net');
    const socket = new net.Socket();
    
    socket.setTimeout(3000);
    
    socket.connect(6379, 'localhost', () => {
      socket.end();
      resolve({
        name: 'Redis Cache',
        status: 'healthy',
        success: true
      });
    });
    
    socket.on('error', (error) => {
      resolve({
        name: 'Redis Cache',
        status: 'error',
        error: error.message,
        success: false
      });
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve({
        name: 'Redis Cache',
        status: 'timeout',
        error: 'Connection timeout',
        success: false
      });
    });
  });
}

async function runHealthCheck() {
  console.log(colorize('🏥 Smart Helpdesk Health Check', 'blue'));
  console.log(colorize('=' .repeat(50), 'blue'));
  console.log();

  const results = [];
  
  // Check HTTP services
  for (const [key, service] of Object.entries(SERVICES)) {
    process.stdout.write(`Checking ${service.name}... `);
    const result = await checkService(service.name, service.url);
    results.push(result);
    
    if (result.success) {
      console.log(colorize('✓ Healthy', 'green'));
    } else {
      console.log(colorize(`✗ ${result.status}`, 'red'));
      if (result.error) {
        console.log(colorize(`  Error: ${result.error}`, 'red'));
      }
    }
  }
  
  // Check MongoDB
  process.stdout.write('Checking MongoDB Database... ');
  const mongoResult = await checkMongoDB();
  results.push(mongoResult);
  
  if (mongoResult.success) {
    console.log(colorize('✓ Healthy', 'green'));
    console.log(colorize(`  Collections: ${mongoResult.collections}`, 'blue'));
  } else {
    console.log(colorize('✗ Error', 'red'));
    console.log(colorize(`  Error: ${mongoResult.error}`, 'red'));
  }
  
  // Check Redis
  process.stdout.write('Checking Redis Cache... ');
  const redisResult = await checkRedis();
  results.push(redisResult);
  
  if (redisResult.success) {
    console.log(colorize('✓ Healthy', 'green'));
  } else {
    console.log(colorize('✗ Error', 'red'));
    console.log(colorize(`  Error: ${redisResult.error}`, 'red'));
  }
  
  console.log();
  console.log(colorize('=' .repeat(50), 'blue'));
  
  const healthyServices = results.filter(r => r.success).length;
  const totalServices = results.length;
  
  if (healthyServices === totalServices) {
    console.log(colorize(`🎉 All services healthy (${healthyServices}/${totalServices})`, 'green'));
    console.log();
    console.log(colorize('Your Smart Helpdesk is ready to use!', 'green'));
    console.log('Frontend: http://localhost:5173');
    console.log('Backend: http://localhost:3000');
    console.log('BullMQ: http://localhost:3001');
  } else {
    console.log(colorize(`⚠️  Some services need attention (${healthyServices}/${totalServices} healthy)`, 'yellow'));
    console.log();
    console.log('Troubleshooting tips:');
    console.log('1. Make sure Docker Desktop is running');
    console.log('2. Run: docker compose ps');
    console.log('3. Check logs: docker compose logs');
    console.log('4. Restart services: docker compose restart');
  }
  
  console.log();
  return healthyServices === totalServices;
}

// Run health check if called directly
if (require.main === module) {
  runHealthCheck()
    .then(allHealthy => {
      process.exit(allHealthy ? 0 : 1);
    })
    .catch(error => {
      console.error(colorize('❌ Health check failed:', 'red'), error.message);
      process.exit(1);
    });
}

module.exports = { runHealthCheck };