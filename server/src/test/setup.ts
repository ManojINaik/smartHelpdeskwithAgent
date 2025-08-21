// Test setup file
import dotenv from 'dotenv';
import path from 'path';
import { beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment (no DB connection here; individual tests can start their own DB)
process.env.NODE_ENV = 'test';
// Encourage mongodb-memory-server to cache binaries in a stable folder across runs
process.env.MONGOMS_DOWNLOAD_DIR = process.env.MONGOMS_DOWNLOAD_DIR || path.resolve('.cache', 'mongodb-binaries');
process.env.MONGOMS_VERSION = process.env.MONGOMS_VERSION || '7.0.14';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only-32-chars';
// Ensure required envs exist before app modules validate them
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_helpdesk_test';
process.env.STUB_MODE = process.env.STUB_MODE || 'true';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    binary: {
      version: process.env.MONGOMS_VERSION,
      downloadDir: process.env.MONGOMS_DOWNLOAD_DIR,
    },
  });
  const uri = mongoServer.getUri();
  process.env.MONGODB_URI = uri;
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 120000 });
});

afterAll(async () => {
  try { await mongoose.connection.dropDatabase(); } catch {}
  try { await mongoose.connection.close(); } catch {}
  try { await mongoServer.stop(); } catch {}
});