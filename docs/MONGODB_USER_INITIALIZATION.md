# MongoDB User Initialization

This document explains the automatic user creation system for the Smart Helpdesk MongoDB database.

## Overview

When Docker builds the MongoDB container for the **first time**, it automatically creates 4 predefined users with specific roles and permissions. This initialization happens only once during the initial container creation and will not run again on subsequent container starts.

## Users Created

The system automatically creates the following users:

| Role     | Name          | Email                          | Password | Access Level                    |
|----------|---------------|--------------------------------|----------|---------------------------------|
| Admin    | Admin User    | admin@smarthelpdesk.com        | admin123 | Full system access, user management, configuration |
| Agent    | John Agent    | john.agent@smarthelpdesk.com   | agent123 | Ticket management, knowledge base |
| Customer | Mike Customer | mike.customer@example.com      | user123  | Create tickets, view own tickets |
| Customer | John Customer | john.customer@example.com      | user456  | Create tickets, view own tickets |

## How It Works

### 1. Docker MongoDB Initialization

The initialization is handled by the `mongo-init.js` script located in `./scripts/mongo-init.js`. This script:

- Runs automatically when the MongoDB container is first created
- Is mounted in the container's `/docker-entrypoint-initdb.d/` directory
- Creates database collections, indexes, and users
- Only executes once per MongoDB data volume

### 2. User Creation Process

The script performs the following steps:

1. **Checks for existing users** - Prevents duplicate user creation
2. **Creates user documents** with complete profile information
3. **Assigns appropriate permissions** based on user roles
4. **Creates default system configuration**
5. **Displays initialization summary**

### 3. User Permissions

Each user is created with role-specific permissions:

#### Admin Permissions
```javascript
{
  canManageUsers: true,
  canManageSystem: true,
  canViewAllTickets: true,
  canManageKnowledgeBase: true,
  canViewReports: true,
  canManageAgents: true
}
```

#### Agent Permissions
```javascript
{
  canManageUsers: false,
  canManageSystem: false,
  canViewAllTickets: true,
  canManageKnowledgeBase: true,
  canViewReports: true,
  canManageAgents: false
}
```

#### Customer Permissions
```javascript
{
  canManageUsers: false,
  canManageSystem: false,
  canViewAllTickets: false,
  canManageKnowledgeBase: false,
  canViewReports: false,
  canManageAgents: false
}
```

## Usage Instructions

### Starting the System

1. **First-time setup** (creates users automatically):
   ```bash
   docker-compose up -d mongodb
   ```

2. **Complete system startup**:
   ```bash
   docker-compose up -d
   ```

3. **Check initialization logs**:
   ```bash
   docker-compose logs mongodb
   ```

### Verification

You can verify that users were created successfully by:

1. **Connecting to MongoDB**:
   ```bash
   docker exec -it smart-helpdesk-mongodb mongosh -u admin -p password --authenticationDatabase admin
   ```

2. **Switching to the application database**:
   ```javascript
   use smart_helpdesk
   ```

3. **Checking created users**:
   ```javascript
   db.users.find({}, {name: 1, email: 1, role: 1}).pretty()
   ```

## Security Notes

⚠️ **Important Security Considerations**:

1. **Change Default Passwords**: The default passwords are for development only. Change them immediately in production:
   - Admin: `admin123`
   - Agent: `agent123` 
   - Customer 1: `user123`
   - Customer 2: `user456`

2. **Environment Variables**: Consider using environment variables for sensitive data in production:
   ```bash
   ADMIN_EMAIL=admin@yourcompany.com
   ADMIN_PASSWORD=secure_password_here
   ```

3. **Database Access**: Ensure MongoDB is properly secured with authentication and network restrictions in production.

## Troubleshooting

### Users Not Created

If users are not being created:

1. **Check MongoDB logs**:
   ```bash
   docker-compose logs mongodb
   ```

2. **Verify script mounting**:
   ```bash
   docker exec -it smart-helpdesk-mongodb ls -la /docker-entrypoint-initdb.d/
   ```

3. **Clear data and rebuild** (⚠️ destroys all data):
   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

### Duplicate Users Error

If you see duplicate key errors:
- The initialization script checks for existing users and skips creation if users already exist
- This is expected behavior on subsequent container starts

### Password Authentication Issues

If you cannot log in with the default credentials:
- Verify the application is properly hashing passwords during login
- Check that the authentication middleware is working correctly
- Ensure the MongoDB connection is using the correct database and authentication

## Files Involved

- `./scripts/mongo-init.js` - Main MongoDB initialization script
- `./scripts/mongo-init-users.js` - Standalone user initialization script (backup)
- `./docker-compose.yml` - Docker configuration with script mounting
- `./scripts/seed-database.js` - Additional sample data seeding (optional)

## Customization

To modify the default users:

1. **Edit the users array** in `./scripts/mongo-init.js`
2. **Update user properties** as needed:
   - Name, email, password
   - Profile information
   - Role and permissions
3. **Rebuild the container** with clean data:
   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

## Integration with Application

The created users integrate with the application's authentication system:

1. **Password Hashing**: The application should hash the plain text passwords on first login
2. **Role-Based Access**: The application should respect the permissions assigned to each user
3. **Profile Management**: Users can update their profile information through the application interface

This initialization system ensures that your Smart Helpdesk application has the necessary users available immediately after deployment, making it ready for testing and development without manual user creation.