# Auto-Seeding System Documentation

The Smart Helpdesk system includes an intelligent auto-seeding mechanism that automatically populates the database with essential data during the first deployment.

## Overview

The auto-seeding system is designed to provide a **one-time initialization** that creates a complete working environment without manual setup. It only runs when the database is empty, making it perfect for development environments and new deployments.

## Features

### ✅ Smart Detection
- Checks if users exist in the database
- Only seeds when the database is completely empty
- Prevents duplicate seeding on container restarts

### ✅ Comprehensive Data Creation
- **Users**: Complete role-based user accounts
- **Knowledge Base**: Helpful articles with realistic content
- **Configuration**: Production-ready system settings

### ✅ Environment Control
- Controlled via `AUTO_SEED` environment variable
- Can be disabled for production environments
- Respects existing data (won't overwrite)

## What Gets Created

### Users (5 accounts)
| Role | Name | Email | Password | Purpose |
|------|------|-------|----------|---------|
| Admin | Admin User | `admin@smarthelpdesk.com` | `admin123` | System administration |
| Agent | John Agent | `john.agent@smarthelpdesk.com` | `agent123` | Ticket management |
| Agent | Sarah Agent | `sarah.agent@smarthelpdesk.com` | `agent123` | Ticket management |
| Customer | Mike Customer | `mike.customer@example.com` | `user123` | Sample customer |
| Customer | Lisa Customer | `lisa.customer@example.com` | `user123` | Sample customer |

### Knowledge Base Articles (5 articles)
1. **"How to Reset Your Password"** - Step-by-step password reset guide
2. **"Billing and Payment FAQ"** - Common billing questions and procedures
3. **"API Integration Guide"** - Developer documentation for API usage
4. **"System Maintenance and Uptime"** - SLA and maintenance information
5. **"Getting Started with Smart Helpdesk"** - User onboarding guide

### System Configuration
- **Auto-close settings**: Confidence thresholds and automation rules
- **SLA configuration**: 24-hour default response time
- **Notification settings**: Email notifications enabled
- **File upload limits**: 10MB max with common file types allowed
- **Security settings**: Default security policies

## Configuration

### Environment Variable
```bash
# Enable auto-seeding (default in development)
AUTO_SEED=true

# Disable auto-seeding (recommended for production)
AUTO_SEED=false
```

### When to Enable/Disable

#### Enable (`AUTO_SEED=true`) when:
- ✅ **Development environment**: Quick setup for testing
- ✅ **Demo deployments**: Instant working system
- ✅ **New installations**: Fresh deployment with sample data
- ✅ **Testing**: Consistent baseline data for tests

#### Disable (`AUTO_SEED=false`) when:
- ❌ **Production environment**: Manual user management preferred
- ❌ **Existing database**: Prevent accidental data creation
- ❌ **Custom setup**: Want to create users manually
- ❌ **Security concerns**: Prefer not to have default accounts

## Implementation Details

### Service Location
- **File**: `server/src/services/autoSeed.service.ts`
- **Integration**: Called during application bootstrap
- **Execution**: Runs after database connection is established

### Safety Mechanisms
1. **User Count Check**: Only runs if `User.countDocuments() === 0`
2. **Session Tracking**: Won't run multiple times in same session
3. **Error Handling**: Graceful failure without breaking application startup
4. **Logging**: Comprehensive logging for debugging and monitoring

### Execution Flow
```
1. Application starts
2. Database connection established
3. Auto-seed service checks environment (AUTO_SEED=true?)
4. Check if users exist (User.countDocuments())
5. If database empty: Execute seeding
6. Create users with bcrypt hashed passwords
7. Create knowledge base articles
8. Create system configuration
9. Log completion and continue startup
```

## Usage Examples

### Development Setup
```bash
# Standard development startup (auto-seeding enabled)
docker compose up --build

# Check seeding logs
docker logs smart-helpdesk-api | grep "auto-seeding"
```

### Fresh Development Environment
```bash
# Clear all data and trigger fresh seeding
docker compose down -v && docker compose up --build
```

### Production Deployment
```bash
# Disable auto-seeding in production
echo "AUTO_SEED=false" >> .env
docker compose -f docker-compose.prod.yml up --build
```

## Troubleshooting

### Common Issues

#### Auto-seeding doesn't run
**Possible causes:**
- `AUTO_SEED=false` in environment
- Database already contains users
- Service failed to start properly

**Solution:**
```bash
# Check environment variable
docker exec smart-helpdesk-api printenv AUTO_SEED

# Check user count
docker exec smart-helpdesk-mongodb mongosh -u admin -p password --authenticationDatabase admin smart_helpdesk --eval "db.users.countDocuments()"

# Check logs for errors
docker logs smart-helpdesk-api | grep -E "auto-seed|error"
```

#### Seeding runs repeatedly
**Cause:** This shouldn't happen due to safety mechanisms

**Solution:**
```bash
# Check if users are being created properly
docker exec smart-helpdesk-mongodb mongosh -u admin -p password --authenticationDatabase admin smart_helpdesk --eval "db.users.find({}, {name: 1, email: 1, role: 1})"
```

#### Permission errors during seeding
**Cause:** Database connection or permission issues

**Solution:**
```bash
# Check database connectivity
docker logs smart-helpdesk-api | grep "MongoDB"

# Verify database credentials in environment
docker exec smart-helpdesk-api printenv MONGODB_URI
```

## Security Considerations

### Default Passwords
- **Development**: Default passwords are acceptable for local development
- **Production**: Change all default passwords immediately after first login
- **Best Practice**: Use strong, unique passwords for each account

### Account Management
- **Disable unused accounts**: Remove or disable accounts not needed
- **Regular rotation**: Change passwords regularly in production
- **Principle of least privilege**: Assign minimal required roles

### Production Recommendations
1. **Disable auto-seeding**: Set `AUTO_SEED=false`
2. **Manual user creation**: Create production users manually
3. **Custom configuration**: Set up production-specific settings
4. **Security audit**: Review all created accounts and permissions

## Monitoring

### Logs to Monitor
```bash
# Check if seeding ran successfully
docker logs smart-helpdesk-api | grep "🌱 Starting database auto-seeding"
docker logs smart-helpdesk-api | grep "✅ Database auto-seeding completed"

# Check for seeding errors
docker logs smart-helpdesk-api | grep "❌ Auto-seeding failed"

# Monitor user creation
docker logs smart-helpdesk-api | grep "👥 Creating default users"
```

### Health Checks
```bash
# Verify auto-generated users exist
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@smarthelpdesk.com", "password": "admin123"}'

# Check knowledge base articles
curl http://localhost:3000/api/kb/all
```

## Integration with Deployment

The auto-seeding system is integrated with the application's bootstrap process and works seamlessly with:

- **Docker Compose**: Automatic execution on container startup
- **Development Scripts**: Included in standard development workflow
- **Production Deployment**: Can be controlled via environment variables
- **CI/CD Pipelines**: Consistent behavior across environments

---

**Note**: This auto-seeding system replaces the previous manual seeding scripts and provides a more robust, intelligent approach to database initialization.