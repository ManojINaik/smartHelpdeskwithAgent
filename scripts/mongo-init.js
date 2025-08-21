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

print('Smart Helpdesk database initialized successfully!');