# Smart Helpdesk Deployment Guide

This guide provides comprehensive instructions for deploying the Smart Helpdesk system in both development and production environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Environment Configuration](#environment-configuration)
4. [Development Deployment](#development-deployment)
5. [Production Deployment](#production-deployment)
6. [Database Management](#database-management)
7. [Monitoring and Health Checks](#monitoring-and-health-checks)
8. [Troubleshooting](#troubleshooting)
9. [Security Considerations](#security-considerations)
10. [Performance Optimization](#performance-optimization)

## Prerequisites

### System Requirements

- **Docker**: Version 20.10 or higher
- **Docker Compose**: Version 2.0 or higher
- **Operating System**: Linux, macOS, or Windows with Docker support
- **Memory**: Minimum 4GB RAM (8GB recommended for production)
- **Storage**: At least 10GB free disk space
- **Network**: Internet connection for downloading Docker images

### Required Accounts and API Keys

- **Google Gemini API Key**: For AI-powered ticket triage
- **Email Service**: For sending notifications (optional)
- **Domain Name**: For production deployment (optional)

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd smart-helpdesk
```

### 2. Set Up Environment

```bash
# Copy environment template
cp .env.example .env

# Edit the environment file with your configuration
nano .env
```

### 3. Deploy the System

```bash
# Make deployment script executable
chmod +x scripts/deploy.sh

# Deploy in development mode
./scripts/deploy.sh development

# Or deploy in production mode
./scripts/deploy.sh production
```

### 4. Access the Application

- **Frontend**: http://localhost:5173 (development) or http://localhost:80 (production)
- **API**: http://localhost:3000
- **Default Admin**: admin@smarthelpdesk.com / admin123

## Environment Configuration

### Environment Variables

The system uses environment variables for configuration. Copy `.env.example` to `.env` and update the values:

#### Database Configuration

```bash
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=your-secure-mongodb-password
REDIS_PASSWORD=your-secure-redis-password
```

#### JWT Configuration

```bash
JWT_SECRET=your-super-secret-jwt-key-must-be-at-least-32-characters-long
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
```

#### AI/LLM Configuration

```bash
GEMINI_API_KEY=your-gemini-api-key-here
LLM_PROVIDER=gemini
STUB_MODE=false
```

#### Security Configuration

```bash
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Environment-Specific Files

- `.env.example`: Template with all available variables
- `.env.development`: Development-specific configuration
- `.env`: Your local environment configuration (create from template)

## Development Deployment

### Features

- Hot reload for code changes
- Development database with sample data
- Debug logging enabled
- Stub AI mode for testing

### Commands

```bash
# Start development environment
./scripts/deploy.sh development

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up --build -d
```

### Development Workflow

1. **Start the system**: `./scripts/deploy.sh development`
2. **Make code changes**: Edit files in `server/src` or `client/src`
3. **View changes**: Changes are automatically reflected
4. **Test features**: Use the seeded sample data
5. **Stop when done**: `docker-compose down`

## Production Deployment

### Features

- Optimized Docker images with multi-stage builds
- Production-ready nginx configuration
- Health checks for all services
- Resource limits and monitoring
- SSL/TLS support (with proper configuration)

### Prerequisites

1. **Secure Environment Variables**: Update all passwords and secrets
2. **Domain Configuration**: Set up DNS for your domain
3. **SSL Certificates**: Obtain SSL certificates for HTTPS
4. **Backup Strategy**: Plan for database backups

### Deployment Steps

```bash
# 1. Configure production environment
cp .env.example .env
# Edit .env with production values

# 2. Deploy production system
./scripts/deploy.sh production

# 3. Verify deployment
docker-compose -f docker-compose.prod.yml ps
```

### Production Configuration

#### SSL/TLS Setup

1. **Obtain SSL Certificates**:
   ```bash
   # Using Let's Encrypt (example)
   certbot certonly --standalone -d yourdomain.com
   ```

2. **Configure Nginx**:
   ```bash
   # Copy certificates to nginx/ssl/
   cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
   cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/
   ```

3. **Update Nginx Configuration**:
   Edit `nginx/nginx.conf` to include SSL configuration.

#### Resource Management

The production configuration includes resource limits:

```yaml
deploy:
  resources:
    limits:
      memory: 512M
      cpus: '0.5'
    reservations:
      memory: 256M
      cpus: '0.25'
```

## Database Management

### Initial Setup

The system automatically creates the database schema and indexes on first run.

### Seeding Sample Data

```bash
# Seed database with sample data (development only)
docker-compose exec api node scripts/seed-database.js

# Or run the seed script directly
node scripts/seed-database.js
```

### Backup and Restore

#### MongoDB Backup

```bash
# Create backup
docker-compose exec mongodb mongodump --out /backup/$(date +%Y%m%d_%H%M%S)

# Copy backup from container
docker cp smart-helpdesk-mongodb:/backup ./backups
```

#### MongoDB Restore

```bash
# Restore from backup
docker-compose exec mongodb mongorestore /backup/20231201_120000/
```

#### Redis Backup

```bash
# Redis data is automatically persisted with AOF
# Manual backup
docker-compose exec redis redis-cli BGSAVE
```

### Database Maintenance

```bash
# Check database health
docker-compose exec api node -e "
const { MongoClient } = require('mongodb');
const client = new MongoClient(process.env.MONGODB_URI);
client.connect().then(() => {
  console.log('Database connection: OK');
  client.close();
});
"

# Monitor database performance
docker-compose exec mongodb mongosh --eval "db.stats()"
```

## Monitoring and Health Checks

### Health Check Endpoints

- **API Health**: `GET /health` - Basic health check
- **API Ready**: `GET /healthz` - Detailed health with database status
- **Client Health**: `GET /health` - Frontend health check

### Monitoring Commands

```bash
# Check service status
docker-compose ps

# View service logs
docker-compose logs -f [service-name]

# Monitor resource usage
docker stats

# Check health status
curl http://localhost:3000/health
curl http://localhost:3000/healthz
```

### Log Management

```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs api
docker-compose logs client

# Follow logs in real-time
docker-compose logs -f

# View logs with timestamps
docker-compose logs -t
```

## Troubleshooting

### Common Issues

#### 1. Port Conflicts

**Problem**: Services fail to start due to port conflicts

**Solution**:
```bash
# Check what's using the ports
netstat -tulpn | grep :3000
netstat -tulpn | grep :5173

# Stop conflicting services or change ports in docker-compose.yml
```

#### 2. Database Connection Issues

**Problem**: API can't connect to MongoDB

**Solution**:
```bash
# Check MongoDB status
docker-compose logs mongodb

# Restart MongoDB
docker-compose restart mongodb

# Check network connectivity
docker-compose exec api ping mongodb
```

#### 3. Memory Issues

**Problem**: Services crash due to insufficient memory

**Solution**:
```bash
# Increase Docker memory limit
# In Docker Desktop: Settings > Resources > Memory

# Or reduce resource limits in docker-compose.yml
```

#### 4. Permission Issues

**Problem**: Permission denied errors

**Solution**:
```bash
# Fix file permissions
chmod +x scripts/*.sh

# Fix Docker volume permissions
sudo chown -R $USER:$USER ./data
```

### Debug Mode

Enable debug logging:

```bash
# Set debug environment variable
export LOG_LEVEL=debug

# Restart services
docker-compose restart api
```

### Reset Everything

```bash
# Stop all services
docker-compose down

# Remove all containers and volumes
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Start fresh
./scripts/deploy.sh development
```

## Security Considerations

### Production Security Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT secrets (32+ characters)
- [ ] Enable HTTPS with valid SSL certificates
- [ ] Configure proper CORS origins
- [ ] Set up firewall rules
- [ ] Enable rate limiting
- [ ] Use non-root containers
- [ ] Regular security updates
- [ ] Database access control
- [ ] Backup encryption

### Security Best Practices

1. **Environment Variables**: Never commit `.env` files to version control
2. **Secrets Management**: Use Docker secrets or external secret management
3. **Network Security**: Use Docker networks to isolate services
4. **Container Security**: Run containers as non-root users
5. **Regular Updates**: Keep Docker images and dependencies updated

### Security Monitoring

```bash
# Check for security vulnerabilities
docker-compose exec api npm audit

# Monitor failed login attempts
docker-compose logs api | grep "Failed login"

# Check for suspicious activity
docker-compose logs api | grep "ERROR"
```

## Performance Optimization

### Production Optimizations

1. **Resource Limits**: Set appropriate CPU and memory limits
2. **Caching**: Enable Redis caching for frequently accessed data
3. **CDN**: Use a CDN for static assets
4. **Database Indexing**: Ensure proper database indexes
5. **Load Balancing**: Use nginx for load balancing

### Performance Monitoring

```bash
# Monitor API response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000/health

# Check database performance
docker-compose exec mongodb mongosh --eval "db.currentOp()"

# Monitor memory usage
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

### Scaling

For horizontal scaling:

1. **API Scaling**: Use multiple API instances behind a load balancer
2. **Database Scaling**: Consider MongoDB replica sets for read scaling
3. **Redis Clustering**: Use Redis Cluster for high availability

## Support and Maintenance

### Regular Maintenance Tasks

1. **Daily**: Check service health and logs
2. **Weekly**: Review error logs and performance metrics
3. **Monthly**: Update dependencies and security patches
4. **Quarterly**: Review and update backup strategies

### Getting Help

- **Documentation**: Check this guide and inline code comments
- **Logs**: Review service logs for error details
- **Community**: Check project issues and discussions
- **Support**: Contact the development team for critical issues

### Contributing

To contribute to the deployment process:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Note**: This deployment guide is part of the Smart Helpdesk system. For the most up-to-date information, always refer to the latest version of this document and the project repository.
