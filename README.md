# Smart Helpdesk with Agentic Triage 🎫

An intelligent customer support system that combines AI-powered automation with human expertise to provide efficient ticket triage and resolution.

## 🚀 Quick Start (One-Command Setup)

**For complete beginners:** Follow the [Detailed Setup Guide](#-detailed-setup-guide-for-beginners) below.

**For experienced users:**
```bash
# Clone and start everything
git clone https://github.com/ManojINaik/smartHelpdeskwithAgent/
cd smartHelpdeskwithAgent
docker compose up --build
```

**Use automated setup scripts:**

- **Windows:** Double-click `setup.bat` or run in Command Prompt
- **Mac/Linux:** Run `./setup.sh` in Terminal
- **Manual:** Use `npm run setup` after installing Node.js

Then open http://localhost:5173 in your browser!

## 🔗 Quick Reference

### Essential URLs
- **🏠 Main Application:** http://localhost:5173
- **🔌 API Server:** http://localhost:3000
- **📈 Job Dashboard:** http://localhost:3001 (BullMQ)
- **❤️ Health Check:** http://localhost:3000/health

### Default Login Accounts (Auto-Created)

**🔐 Automatic User Initialization**

When you first start the MongoDB container, 4 users are automatically created with predefined roles and permissions:

| Role | Name | Email | Password | Access Level |
|------|------|-------|----------|-------------|
| Admin | Admin User | `admin@smarthelpdesk.com` | `admin123` | Full system access, user management, configuration |
| Agent | John Agent | `john.agent@smarthelpdesk.com` | `agent123` | Ticket management, knowledge base |
| Customer | Mike Customer | `mike.customer@example.com` | `user123` | Create tickets, view own tickets |
| Customer | John Customer | `john.customer@example.com` | `user456` | Create tickets, view own tickets |

**⚠️ Security Note:** These are development credentials. **Change passwords immediately in production!**

**How it works:**
- Users are created automatically during first MongoDB container startup
- Initialization happens only once (won't recreate on restart)
- Controlled by `./scripts/mongo-init.js` script
- See [User Initialization Guide](./docs/MONGODB_USER_INITIALIZATION.md) for detailed documentation

### Quick Commands
```bash
# Start everything
docker compose up

# Fresh restart (clears data)
docker compose down -v && docker compose up --build

# View logs
docker compose logs -f

# Stop everything
docker compose down

# Test user initialization (optional)
./scripts/test-user-init.sh    # Linux/Mac
.\scripts\test-user-init.bat   # Windows

# Reset users (development only)
node scripts/reset-users.js
```

## 🛠 Detailed Setup Guide for Beginners

### Step 1: Install Required Software

**You need these programs installed on your computer:**

1. **Docker Desktop** (Required)
   - **Windows/Mac:** Download from https://www.docker.com/products/docker-desktop/
   - **Linux:** Follow instructions at https://docs.docker.com/engine/install/
   - ✅ After installation, make sure Docker Desktop is running (you'll see a whale icon in your system tray)

2. **Git** (Required for cloning)
   - Download from https://git-scm.com/downloads
   - ✅ Test installation by opening terminal/command prompt and typing: `git --version`

### Step 2: Download the Project

1. **Open Terminal/Command Prompt:**
   - **Windows:** Press `Win + R`, type `cmd`, press Enter
   - **Mac:** Press `Cmd + Space`, type `Terminal`, press Enter
   - **Linux:** Press `Ctrl + Alt + T`

2. **Navigate to where you want the project:**
   ```bash
   # Example: Go to Desktop
   cd Desktop
   ```

3. **Clone the project:**
   ```bash
   git clone https://github.com/ManojINaik/smartHelpdeskwithAgent/
   cd smartHelpdeskwithAgent
   ```

### Step 3: Start the Application

1. **Make sure Docker Desktop is running** (check for the whale icon)

2. **Run the magic command:**
   ```bash
   docker compose up --build
   ```

   **What this does:**
   - Downloads and sets up MongoDB database
   - Downloads and sets up Redis for caching
   - Sets up BullMQ for job processing
   - Builds and starts the backend API server
   - Builds and starts the frontend web application
   - Automatically seeds the database with sample data

3. **Wait for completion** (2-5 minutes first time):
   - You'll see lots of text scrolling
   - Look for these success messages:
     - `smart-helpdesk-mongodb | waiting for connections on port 27017`
     - `smart-helpdesk-api | Server running on port 3000`
     - `smart-helpdesk-client | Local: http://localhost:5173/`

### Step 4: Access the Application

**🎉 Your application is ready!**

1. **Open your web browser**
2. **Go to:** http://localhost:5173
3. **Login with default accounts:**
   - **Admin:** `admin@smarthelpdesk.com` / `admin123`
   - **Agent:** `john.agent@smarthelpdesk.com` / `agent123`
   - **Customer:** `mike.customer@example.com` / `user123`

### Step 5: Explore Additional Services

- **API Documentation:** http://localhost:3000 (Backend API)
- **BullMQ Dashboard:** http://localhost:3001 (Job Queue Management)
- **Database:** MongoDB running on port 27017

## 🏗 Architecture Overview

### Technology Stack
- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **Database:** MongoDB with Mongoose ODM
- **Cache & Jobs:** Redis + BullMQ
- **AI Integration:** Gemini AI with intelligent stub fallback
- **Containerization:** Docker + Docker Compose

### Services Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   MongoDB       │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (Database)    │
│   Port: 5173    │    │   Port: 3000    │    │   Port: 27017   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         │                        ▼                        │
         │              ┌─────────────────┐                │
         │              │   Redis         │                │
         │              │   (Cache/Jobs)  │                │
         │              │   Port: 6379    │                │
         │              └─────────────────┘                │
         │                        │                        │
         │                        ▼                        │
         │              ┌─────────────────┐                │
         │              │   BullMQ Board  │                │
         │              │   (Dashboard)   │                │
         │              │   Port: 3001    │                │
         │              └─────────────────┘                │
         │                                                 │
         └─────────────────────────────────────────────────┘
                                   │
                         ┌─────────────────┐
                         │   Seeder        │
                         │   (One-time)    │
                         │   Auto-runs     │
                         └─────────────────┘
```

## 📊 Features

### Core Functionality
- 🎫 **Ticket Management:** Create, track, and resolve support tickets
- 🤖 **AI-Powered Triage:** Automatic ticket classification and routing
- 👥 **User Management:** Admin, Agent, and Customer roles
- 📚 **Knowledge Base:** Searchable articles with markdown support
- 🔔 **Real-time Notifications:** WebSocket-powered live updates
- 📈 **Analytics Dashboard:** Metrics and performance insights
- 🔍 **Advanced Search:** Full-text search with MongoDB Atlas Vector Search integration
- 📊 **Audit Trail:** Comprehensive activity logging and tracking

### AI Features
- **Smart Classification:** Automatic categorization (billing, tech, shipping, other)
- **Confidence Scoring:** AI confidence levels for decision making
- **Auto-Resolution:** High-confidence tickets resolved automatically
- **Agent Suggestions:** AI-generated response recommendations
- **RAG Integration:** Retrieval-Augmented Generation with knowledge base
- **Vector Search:** Semantic search using MongoDB Atlas (M10+ clusters)
- **Hybrid Search:** Combines vector similarity with keyword matching (70/30 split)
- **Fallback System:** Graceful degradation when Atlas is unavailable

### Advanced Features
- **MongoDB Atlas Vector Search:** Advanced semantic search capabilities
  - 384-dimensional embeddings for semantic understanding
  - Hybrid search combining vector similarity (70%) and keyword matching (30%)
  - Automatic fallback to legacy search for free tier MongoDB
  - Requires M10+ cluster for production (free tier uses in-memory similarity)
- **Comprehensive Audit System:** 
  - Complete workflow tracking with UUIDs
  - 90-day retention policy with automatic cleanup
  - Real-time activity timeline in ticket details
  - Support for status changes, escalations, and system actions
- **Intelligent Workflow Orchestration:**
  - 6-step AI triage process (PLANNING → CLASSIFYING → RETRIEVING → DRAFTING → DECIDING → ASSIGNING)
  - Round-robin agent assignment based on categories
  - Configurable confidence thresholds for auto-closing
  - Error handling with exponential backoff retry logic
- **Enhanced Knowledge Base:**
  - Markdown support with real-time preview
  - Article embedding generation for semantic search
  - Automatic relevance scoring and ranking
  - Admin interface for content management

### User Experience
- **Responsive Design:** Works on desktop, tablet, and mobile
- **Modern UI:** Clean interface with Tailwind CSS and Mulish font
- **Form Validation:** Real-time input validation with helpful errors
- **Loading States:** Professional loading animations throughout
- **Error Handling:** Graceful error messages and recovery
- **Dark Mode Ready:** Modern design system with theme support

## 🛠 Development Commands

### Basic Operations
```bash
# Start everything (production-like)
docker compose up

# Start with live code reloading (development)
docker compose up --watch

#start client(frontend)
docker start smart-helpdesk-client

# Start specific services
docker compose up mongodb redis  # Only database services
docker compose up api client     # Only application services

# Rebuild containers (after code changes)
docker compose up --build

# Stop everything
docker compose down

# Stop and remove all data (fresh start)
docker compose down -v
```

### Database Operations
```bash
# Seed database with sample data
docker compose run --rm seeder

# Connect to MongoDB shell
docker compose exec mongodb mongosh mongodb://admin:password@localhost:27017/smart_helpdesk?authSource=admin

# View database logs
docker compose logs mongodb
```

### Development Workflow
```bash
# View all service logs
docker compose logs -f

# View specific service logs
docker compose logs -f api      # Backend logs
docker compose logs -f client   # Frontend logs
docker compose logs -f mongodb  # Database logs

# Restart specific service
docker compose restart api

# Execute commands in running containers
docker compose exec api npm test        # Run backend tests
docker compose exec client npm test     # Run frontend tests
```

## 🔧 Configuration

### Environment Variables
The system automatically uses sensible defaults. For customization, create a `.env` file:

```bash
# Copy example configuration
cp .env.example .env
```

Key configuration options:
- `MONGODB_URI`: Database connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: Authentication secret key
- `LLM_PROVIDER`: AI provider (stub/gemini)
- `STUB_MODE`: Enable AI stub mode for development
- `AUTO_CLOSE_ENABLED`: Enable automatic ticket resolution
- `CONFIDENCE_THRESHOLD`: AI confidence threshold for auto-closing (default: 0.6)

### MongoDB Atlas Vector Search Configuration
For enhanced semantic search capabilities (requires M10+ cluster):

```bash
# Atlas Vector Search Settings
ATLAS_VECTOR_SEARCH_ENABLED=true
ATLAS_VECTOR_INDEX_NAME="vector_index"
ATLAS_VECTOR_DIMENSIONS=384
ATLAS_VECTOR_METRIC="cosine"
ATLAS_VECTOR_MIN_SCORE=0.5
ATLAS_VECTOR_SCORE_THRESHOLD=0.7
ATLAS_VECTOR_SEARCH_TIMEOUT=5000
```

**Important Notes:**
- MongoDB Atlas Vector Search requires **M10+ cluster tier** (paid tier ~$57/month)
- **Free tier (M0/M2/M5) clusters:** Set `ATLAS_VECTOR_SEARCH_ENABLED=false` to use legacy search
- **Development:** Use legacy mode for local development, Atlas for production
- **Automatic Fallback:** System gracefully falls back to legacy search when Atlas is unavailable

### Sample Data Configuration
```bash
# Customize sample data size
SAMPLE_DATA_SIZE=100  # Default: 50

# Auto-seed on API startup
AUTO_SEED=true  # Default: true
```

## 🐛 Troubleshooting

### Common Issues

**❌ "Docker is not running"**
- **Solution:** Start Docker Desktop and wait for it to fully load
- **Check:** Look for whale icon in system tray

**❌ "Port already in use"**
- **Solution:** Stop conflicting services:
  ```bash
  # Check what's using the port
  netstat -an | grep :3000
  # Kill the process or change ports in docker-compose.yml
  ```

**❌ "Cannot connect to database"**
- **Solution:** Wait longer for services to start, or restart:
  ```bash
  docker compose down
  docker compose up --build
  ```

**❌ "Application won't load"**
- **Solution:** Check all services are running:
  ```bash
  docker compose ps
  # Should show all services as "Up"
  ```

**❌ "Permission denied" (Linux/Mac)**
- **Solution:** Fix file permissions:
  ```bash
  sudo chown -R $USER:$USER .
  ```

**❌ "Vector search not working"**
- **Check:** MongoDB Atlas cluster tier (requires M10+)
- **Solution:** Either upgrade to M10+ or set `ATLAS_VECTOR_SEARCH_ENABLED=false`
- **Fallback:** System automatically uses legacy search when Atlas unavailable

**❌ "Status showing as 'unknown' in timeline"**
- **Fixed:** Recent update resolved audit log display issues
- **Solution:** Restart application to get latest fixes

**❌ "Embeddings generation failing"**
- **Check:** Vector dimensions must be exactly 384
- **Solution:** Verify Atlas index configuration matches `ATLAS_VECTOR_DIMENSIONS=384`

### Getting Help

1. **Check service status:**
   ```bash
   docker compose ps
   ```

2. **View error logs:**
   ```bash
   docker compose logs
   ```

3. **Fresh restart:**
   ```bash
   docker compose down -v
   docker compose up --build
   ```

## 📚 Default Login Credentials

After startup, you can login with these default accounts:

| Role | Email | Password | Access Level |
|------|-------|----------|-------------|
| **Admin** | `admin@smarthelpdesk.com` | `admin123` | Full system access, user management, configuration |
| **Agent** | `john.agent@smarthelpdesk.com` | `agent123` | Ticket management, knowledge base |
| **Customer** | `mike.customer@example.com` | `user123` | Create tickets, view own tickets |

## 🔒 Security Notes

- **Development Only:** Default credentials are for development/testing
- **Production:** Change all default passwords before deploying
- **JWT Secret:** Generate a strong random key for production
- **Database:** Secure MongoDB with proper authentication
- **HTTPS:** Enable SSL/TLS for production deployments

## 🆕 Recent Updates & Improvements

### Latest Features (August 2025)
- **✅ Fixed Status Display Issue:** Resolved "Status changed to unknown" bug in activity timeline
- **🔍 Enhanced Vector Search:** MongoDB Atlas Vector Search integration with automatic fallback
- **📄 Improved Audit Logging:** Comprehensive activity tracking with 90-day retention
- **🤖 Advanced RAG System:** Retrieval-Augmented Generation for smarter AI responses
- **🔄 Workflow Orchestration:** 6-step intelligent triage process with error handling
- **📋 Modern UI Updates:** Enhanced design system with Mulish font and improved layouts
- **🔐 Enhanced Security:** Improved authentication and role-based access controls
- **🛮 Deletion Management:** Proper authorization for ticket deletion with audit trails

### Performance Improvements
- **Faster Search:** Vector search provides 50-100ms response times on Atlas M10+
- **Scalability:** Supports 1M+ documents with Atlas, 50K+ with legacy search
- **Reliability:** Exponential backoff retry logic for robust error handling
- **Monitoring:** Health checks and performance metrics for system monitoring

### Developer Experience
- **One-Command Setup:** Automated setup scripts for Windows, Mac, and Linux
- **Docker Integration:** Complete containerization with Docker Compose
- **Hot Reloading:** Live code updates during development
- **Comprehensive Testing:** Unit tests, integration tests, and E2E testing

## 📖 API Documentation

Once running, explore the API:
- **Base URL:** http://localhost:3000
- **Health Check:** http://localhost:3000/health
- **Interactive Docs:** Available in development mode

### Key API Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh access token

#### Ticket Management
- `GET /api/tickets` - List tickets (with filtering)
- `POST /api/tickets` - Create new ticket
- `GET /api/tickets/:id` - Get ticket details
- `PUT /api/tickets/:id/status` - Update ticket status
- `POST /api/tickets/:id/reply` - Add reply to ticket
- `DELETE /api/tickets/:id` - Delete ticket (creator/admin only)

#### Audit Logging
- `GET /api/audit` - Get system audit logs
- `GET /api/audit/tickets/:id` - Get ticket audit trail
- Query parameters: `actor`, `action`, `from`, `to`, `limit`

#### Knowledge Base
- `GET /api/kb/articles` - List articles
- `POST /api/kb/articles` - Create article (admin/agent)
- `GET /api/kb/articles/:id` - Get article details
- `PUT /api/kb/articles/:id` - Update article
- `DELETE /api/kb/articles/:id` - Delete article

#### RAG & Vector Search
- `POST /api/rag/search` - Semantic search with embeddings
- `GET /api/rag/health` - RAG system health check
- `POST /api/rag/test` - Test search functionality (admin only)

#### Admin Endpoints
- `GET /api/admin/users` - Manage users
- `GET /api/admin/metrics` - System metrics
- `POST /api/admin/config` - Update system configuration

## 🏢 Production Deployment

For production deployment:

```bash
# Use production configuration
docker compose -f docker-compose.prod.yml up --build
```

See `DEPLOYMENT.md` for detailed production setup instructions.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**🎉 Congratulations! You now have a fully functional AI-powered helpdesk system running locally.**


*Need help? Check the troubleshooting section above or create an issue in the repository.*
