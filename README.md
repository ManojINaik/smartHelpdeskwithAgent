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
         │              ┌─────────────────┐    ┌─────────────────┐
         │              │   Redis         │    │   BullMQ Board  │
         │              │   (Cache/Jobs)  │    │   (Dashboard)   │
         │              │   Port: 6379    │    │   Port: 3001    │
         │              └─────────────────┘    └─────────────────┘
         │
    ┌─────────────────┐
    │   Auto Seeder   │
    │   (One-time)    │
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

### AI Features
- **Smart Classification:** Automatic categorization (billing, tech, shipping, other)
- **Confidence Scoring:** AI confidence levels for decision making
- **Auto-Resolution:** High-confidence tickets resolved automatically
- **Agent Suggestions:** AI-generated response recommendations
- **Audit Trail:** Complete workflow tracking with timestamps

### User Experience
- **Responsive Design:** Works on desktop, tablet, and mobile
- **Dark Mode Ready:** Modern UI with theme support
- **Form Validation:** Real-time input validation with helpful errors
- **Loading States:** Professional loading animations throughout
- **Error Handling:** Graceful error messages and recovery

## 🛠 Development Commands

### Basic Operations
```bash
# Start everything (production-like)
docker compose up

# Start with live code reloading (development)
docker compose up --watch

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

## 📖 API Documentation

Once running, explore the API:
- **Base URL:** http://localhost:3000
- **Health Check:** http://localhost:3000/health
- **Interactive Docs:** Available in development mode

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
