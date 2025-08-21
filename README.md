# Smart Helpdesk with Agentic Triage

An intelligent customer support system that combines AI-powered automation with human expertise to provide efficient ticket triage and resolution.

## Architecture

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Cache**: Redis (optional)
- **AI Integration**: Gemini AI with stub mode fallback

## Project Structure

```
├── client/                 # React frontend
├── server/                 # Node.js backend
├── docker-compose.yml      # Development environment
├── .env.example           # Environment variables template
└── README.md              # This file
```

## Quick Start

1. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

2. Start development environment:
   ```bash
   docker-compose up -d
   ```

3. Install dependencies and start development servers:
   ```bash
   # Backend
   cd server && npm install && npm run dev

   # Frontend (in another terminal)
   cd client && npm install && npm run dev
   ```

## Development

- Frontend runs on http://localhost:5173
- Backend API runs on http://localhost:3000
- MongoDB runs on localhost:27017
- Redis runs on localhost:6379

## Testing

```bash
# Backend tests
cd server && npm test

# Frontend tests
cd client && npm test
```