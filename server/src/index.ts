// Smart Helpdesk API Server Entry Point
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { validateEnv } from './config/env.js';
import dbConnection from './config/database.js';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import kbRoutes from './routes/kb.routes.js';
import ticketRoutes from './routes/ticket.routes.js';
import agentRoutes from './routes/agent.routes.js';
import requestLogger from './middleware/logger.js';
import auditRoutes from './routes/audit.routes.js';
import configRoutes from './routes/config.routes.js';
import adminRoutes from './routes/admin.routes.js';
import sanitizeRequest from './middleware/security.js';

// Load environment variables
dotenv.config();
validateEnv();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    const allowed = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map(s => s.trim());
    if (!origin || allowed.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeRequest);

// Request logging middleware (structured)
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});
// Alias per assignment wording
app.get('/healthz', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Readiness endpoint
app.get('/readyz', async (req, res) => {
  const isDbHealthy = dbConnection.isHealthy();
  res.status(isDbHealthy ? 200 : 503).json({
    status: isDbHealthy ? 'ready' : 'not_ready',
    db: dbConnection.getConnectionState(),
    timestamp: new Date().toISOString()
  });
});

// Basic API route
app.get('/api', (req, res) => {
  res.json({
    message: 'Smart Helpdesk API',
    version: '1.0.0',
    documentation: '/api/docs'
  });
});

// Auth routes
app.use('/api/auth', authRoutes);
// KB routes
app.use('/api/kb', kbRoutes);
// Ticket routes
app.use('/api/tickets', ticketRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/config', configRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found'
    }
  });
});

// Error handler
app.use(errorHandler);

async function bootstrap() {
  try {
    // Ensure database is connected before accepting requests
    await dbConnection.connect();

    const server = app.listen(PORT, () => {
      console.log(`🚀 Smart Helpdesk API server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Initialize WebSocket notifications after server starts
    const { default: Notifications } = await import('./services/notify.service.js');
    Notifications.init(server);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

bootstrap();