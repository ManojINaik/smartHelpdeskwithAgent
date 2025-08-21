import mongoose from 'mongoose';
import { getEnvConfig } from './env.js';

interface ConnectionOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private isConnected = false;
  private retryCount = 0;
  private maxRetries = 5;
  private retryDelay = 5000; // 5 seconds
  private timeout = 30000; // 30 seconds

  private constructor() {}

  static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  async connect(options: ConnectionOptions = {}): Promise<void> {
    const config = getEnvConfig();
    
    this.maxRetries = options.maxRetries ?? this.maxRetries;
    this.retryDelay = options.retryDelay ?? this.retryDelay;
    this.timeout = options.timeout ?? this.timeout;

    if (this.isConnected) {
      console.log('📦 Database already connected');
      return;
    }

    await this.connectWithRetry(config.MONGODB_URI);
  }

  private async connectWithRetry(uri: string): Promise<void> {
    try {
      console.log(`🔄 Attempting to connect to MongoDB (attempt ${this.retryCount + 1}/${this.maxRetries})`);
      
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: this.timeout,
        socketTimeoutMS: this.timeout,
        family: 4, // Use IPv4, skip trying IPv6
        maxPoolSize: 10,
        minPoolSize: 5,
        maxIdleTimeMS: 30000,
        bufferCommands: false,
      });

      this.isConnected = true;
      this.retryCount = 0;
      console.log('✅ Successfully connected to MongoDB');
      
      // Set up connection event listeners
      this.setupEventListeners();
      
    } catch (error) {
      console.error(`❌ MongoDB connection failed:`, error);
      
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`⏳ Retrying connection in ${this.retryDelay / 1000} seconds...`);
        
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        
        // Exponential backoff
        this.retryDelay = Math.min(this.retryDelay * 1.5, 30000);
        
        return this.connectWithRetry(uri);
      } else {
        console.error('💥 Max retry attempts reached. Could not connect to MongoDB');
        throw new Error('Database connection failed after maximum retry attempts');
      }
    }
  }

  private setupEventListeners(): void {
    mongoose.connection.on('connected', () => {
      console.log('📦 Mongoose connected to MongoDB');
      this.isConnected = true;
    });

    mongoose.connection.on('error', (error) => {
      console.error('❌ Mongoose connection error:', error);
      this.isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('📦 Mongoose disconnected from MongoDB');
      this.isConnected = false;
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      await this.disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.disconnect();
      process.exit(0);
    });
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.connection.close();
      this.isConnected = false;
      console.log('📦 MongoDB connection closed');
    } catch (error) {
      console.error('❌ Error closing MongoDB connection:', error);
      throw error;
    }
  }

  isHealthy(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  getConnectionState(): string {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };
    return states[mongoose.connection.readyState as keyof typeof states] || 'unknown';
  }
}

export const dbConnection = DatabaseConnection.getInstance();
export default dbConnection;