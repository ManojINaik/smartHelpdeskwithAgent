import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Article from '../models/Article.js';
import Config from '../models/Config.js';
import { getEnvConfig } from '../config/env.js';

export class AutoSeedService {
  private static hasSeeded = false;

  static async seedIfEmpty(): Promise<void> {
    // Only seed if enabled and haven't seeded before in this session
    const config = getEnvConfig();
    if (!config.AUTO_SEED || this.hasSeeded) {
      return;
    }

    try {
      // Check if database already has users (indicating it's been seeded)
      const userCount = await User.countDocuments();
      if (userCount > 0) {
        console.log('📊 Database already contains users, skipping auto-seed');
        this.hasSeeded = true;
        return;
      }

      console.log('🌱 Starting database auto-seeding...');
      
      await this.seedUsers();
      await this.seedKnowledgeBase();
      await this.seedConfig();
      
      console.log('✅ Database auto-seeding completed successfully!');
      this.hasSeeded = true;

    } catch (error) {
      console.error('❌ Auto-seeding failed:', error);
      throw error;
    }
  }

  private static async seedUsers(): Promise<void> {
    console.log('👥 Creating default users...');
    
    const users = [
      {
        name: 'Admin User',
        email: 'admin@smarthelpdesk.com',
        password_hash: await bcrypt.hash('admin123', 10),
        role: 'admin' as const,
      },
      {
        name: 'John Agent',
        email: 'john.agent@smarthelpdesk.com',
        password_hash: await bcrypt.hash('agent123', 10),
        role: 'agent' as const,
      },
      {
        name: 'Sarah Agent',
        email: 'sarah.agent@smarthelpdesk.com',
        password_hash: await bcrypt.hash('agent123', 10),
        role: 'agent' as const,
      },
      {
        name: 'Mike Customer',
        email: 'mike.customer@example.com',
        password_hash: await bcrypt.hash('user123', 10),
        role: 'user' as const,
      },
      {
        name: 'Lisa Customer',
        email: 'lisa.customer@example.com',
        password_hash: await bcrypt.hash('user123', 10),
        role: 'user' as const,
      }
    ];

    await User.insertMany(users);
    console.log(`✅ Created ${users.length} users (1 admin, 2 agents, 2 customers)`);
  }

  private static async seedKnowledgeBase(): Promise<void> {
    console.log('📚 Creating knowledge base articles...');
    
    // Get admin user for article creation
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      throw new Error('Admin user not found for article creation');
    }

    const articles = [
      {
        title: 'How to Reset Your Password',
        body: `If you've forgotten your password, follow these steps:

1. **Click on "Forgot Password"**: Navigate to the login page and click the "Forgot Password" link
2. **Enter your email address**: Provide the email address associated with your account
3. **Check your email**: Look for a password reset email (check spam folder if needed)
4. **Click the reset link**: Follow the link in the email within 24 hours
5. **Create a new password**: Choose a strong password with at least 8 characters

**Security Tips:**
- Use a combination of letters, numbers, and special characters
- Don't reuse old passwords
- Consider using a password manager

If you continue to have issues, please contact our support team.`,
        tags: ['password', 'account', 'security', 'login'],
        status: 'published' as const,
        createdBy: adminUser._id,
      },
      {
        title: 'Billing and Payment FAQ',
        body: `Common billing questions and answers:

## Payment Schedule
**When will I be charged?**
Charges are processed on the 1st of each month for the previous month's usage.

**What payment methods do you accept?**
We accept all major credit cards (Visa, MasterCard, American Express) and PayPal.

## Managing Your Account
**How do I update my payment method?**
1. Log into your account
2. Go to Account Settings > Billing
3. Click "Update Payment Method"
4. Enter your new payment information

**How do I view my billing history?**
Navigate to Account Settings > Billing > Invoice History to download past invoices.

## Refunds and Cancellations
**Can I get a refund?**
Refunds are processed within 5-7 business days for eligible cancellations within our refund policy period.

**How do I cancel my subscription?**
Contact our support team or use the cancellation option in your account settings.`,
        tags: ['billing', 'payment', 'faq', 'subscription'],
        status: 'published' as const,
        createdBy: adminUser._id,
      },
      {
        title: 'API Integration Guide',
        body: `Our REST API allows you to integrate our helpdesk system with your existing applications.

## Getting Started

### Authentication
All API requests require authentication using Bearer token:
\`\`\`
Authorization: Bearer YOUR_API_KEY
\`\`\`

### Base URL
\`\`\`
https://api.smarthelpdesk.com/v1
\`\`\`

## Rate Limits
- **Free Plan**: 100 requests per hour
- **Pro Plan**: 1,000 requests per hour
- **Enterprise**: Custom limits

## Core Endpoints

### Tickets
- \`POST /api/tickets\` - Create a new ticket
- \`GET /api/tickets\` - List all tickets
- \`GET /api/tickets/:id\` - Get specific ticket
- \`PUT /api/tickets/:id\` - Update ticket status
- \`DELETE /api/tickets/:id\` - Delete ticket

### Users
- \`GET /api/users/me\` - Get current user info
- \`PUT /api/users/me\` - Update profile

## Error Handling
The API uses standard HTTP status codes:
- \`200\` - Success
- \`400\` - Bad Request
- \`401\` - Unauthorized
- \`429\` - Rate Limited
- \`500\` - Server Error

For detailed documentation, visit our [Developer Portal](https://docs.smarthelpdesk.com).`,
        tags: ['api', 'integration', 'developer', 'documentation'],
        status: 'published' as const,
        createdBy: adminUser._id,
      },
      {
        title: 'System Maintenance and Uptime',
        body: `We maintain our systems regularly to ensure optimal performance and security.

## Scheduled Maintenance

### Weekly Maintenance
**Every Sunday 2:00-4:00 AM UTC**
- Database optimization and cleanup
- Security patch installation
- Performance monitoring updates
- Log rotation and cleanup

### Monthly Maintenance
**First Sunday of each month 1:00-5:00 AM UTC**
- Full system backup verification
- Comprehensive security scan
- Performance analysis and optimization
- Feature updates and rollouts

## Service Level Agreement (SLA)
- **Uptime Guarantee**: 99.9% monthly uptime
- **Response Time**: < 200ms average API response
- **Support Response**: 
  - Critical issues: 1 hour
  - High priority: 4 hours
  - Normal priority: 24 hours

## Status Updates
- Check real-time status: [status.smarthelpdesk.com](https://status.smarthelpdesk.com)
- Subscribe to maintenance notifications in your account settings
- Follow us on Twitter [@SmartHelpdeskStatus](https://twitter.com/SmartHelpdeskStatus)

## Emergency Contacts
For critical system issues outside business hours:
- Emergency hotline: +1-800-HELP-NOW
- Priority email: emergency@smarthelpdesk.com`,
        tags: ['maintenance', 'system', 'schedule', 'uptime', 'sla'],
        status: 'published' as const,
        createdBy: adminUser._id,
      },
      {
        title: 'Getting Started with Smart Helpdesk',
        body: `Welcome to Smart Helpdesk! This guide will help you get started quickly.

## First Steps

### 1. Complete Your Profile
- Upload a profile picture
- Add your contact information
- Set your notification preferences

### 2. Explore the Dashboard
- **Tickets**: View and manage support requests
- **Knowledge Base**: Search for answers to common questions
- **Reports**: Track your support metrics (agents only)

### 3. Submit Your First Ticket
1. Click "Create Ticket" in the top navigation
2. Choose the appropriate category:
   - **Technical**: System issues, bugs, performance
   - **Billing**: Payment, subscription, invoicing
   - **General**: Questions, feature requests, feedback
3. Provide detailed description
4. Attach relevant files or screenshots
5. Submit and track progress

## For Agents

### Managing Tickets
- Use filters to find tickets assigned to you
- Update ticket status as you progress
- Add internal notes for team communication
- Use templates for common responses

### AI Assistant
- Review AI-generated suggestions for ticket responses
- Approve or modify suggestions before sending
- Train the AI by providing feedback on suggestions

## Tips for Success
- **Be Specific**: Provide detailed descriptions of issues
- **Use Categories**: Select the correct category for faster routing
- **Follow Up**: Check ticket status and respond promptly
- **Search First**: Check the knowledge base before creating tickets

Need help? Contact our support team at support@smarthelpdesk.com`,
        tags: ['getting-started', 'tutorial', 'onboarding', 'guide'],
        status: 'published' as const,
        createdBy: adminUser._id,
      }
    ];

    await Article.insertMany(articles);
    console.log(`✅ Created ${articles.length} knowledge base articles`);
  }

  private static async seedConfig(): Promise<void> {
    console.log('⚙️ Creating default configuration...');
    
    // Get admin user for config creation
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      throw new Error('Admin user not found for config creation');
    }

    // Check if config already exists
    const existingConfig = await Config.findOne();
    if (existingConfig) {
      console.log('⚙️ Configuration already exists, skipping');
      return;
    }

    const defaultConfig = {
      autoCloseEnabled: true,
      confidenceThreshold: 0.8,
      slaHours: 24,
      emailNotificationsEnabled: true,
      maxAttachmentSize: 10485760, // 10MB
      allowedAttachmentTypes: ['.txt', '.md', '.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg'],
      updatedBy: adminUser._id,
    };

    await Config.create(defaultConfig);
    console.log('✅ Created default system configuration');
  }
}

export default AutoSeedService;