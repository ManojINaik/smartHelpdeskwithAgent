import dotenv from 'dotenv';
import { z } from 'zod';

// Ensure .env is loaded before any consumer calls validateEnv/getEnvConfig
dotenv.config();

// Environment variables schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  
  // Database
  MONGODB_URI: z.string().min(1, 'MongoDB URI is required'),
  REDIS_URL: z.string().optional(),
  
  // JWT
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  // AI/LLM
  GEMINI_API_KEY: z.string().optional(),
  LLM_PROVIDER: z.enum(['gemini', 'stub']).default('stub'),
  STUB_MODE: z.string().transform(val => val === 'true').default('true'),
  
  // Atlas Vector Search
  ATLAS_VECTOR_SEARCH_ENABLED: z.string().transform(val => val === 'true').default('false'),
  ATLAS_SEARCH_INDEX_NAME: z.string().default('vector_index'),
  ATLAS_VECTOR_DIMENSION: z.string().transform(Number).default('384'),
  ATLAS_VECTOR_SIMILARITY: z.enum(['cosine', 'euclidean', 'dotProduct']).default('cosine'),
  ATLAS_VECTOR_CANDIDATES: z.string().transform(Number).default('100'),
  ATLAS_SEARCH_SCORE_THRESHOLD: z.string().transform(Number).default('0.3'),
  
  // Email
  EMAIL_SERVICE_URL: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  
  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  
  // File Upload
  MAX_FILE_SIZE: z.string().transform(Number).default('10485760'),
  ALLOWED_FILE_TYPES: z.string().default('.txt,.md,.pdf,.doc,.docx'),
  
  // System Configuration
  AUTO_SEED: z.string().transform(val => val === 'true').default('false'),
  AUTO_CLOSE_ENABLED: z.string().transform(val => val === 'true').default('true'),
  CONFIDENCE_THRESHOLD: z.string().transform(Number).default('0.8'),
  LOW_CONFIDENCE_THRESHOLD: z.string().transform(Number).default('0.5'),
  ESCALATION_ENABLED: z.string().transform(val => val === 'true').default('true'),
  HIGH_PRIORITY_THRESHOLD: z.string().transform(Number).default('0.3'),
  SLA_HOURS: z.string().transform(Number).default('24'),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FORMAT: z.enum(['json', 'simple']).default('json'),
});

export type EnvConfig = z.infer<typeof envSchema>;

let envConfig: EnvConfig;

export function validateEnv(): EnvConfig {
  try {
    envConfig = envSchema.parse(process.env);
    
    // Log important configuration for debugging (without sensitive info)
    console.log('⚙️ Environment configuration validated:');
    console.log(`- NODE_ENV: ${envConfig.NODE_ENV}`);
    console.log(`- PORT: ${envConfig.PORT}`);
    console.log(`- LLM_PROVIDER: ${envConfig.LLM_PROVIDER}`);
    console.log(`- STUB_MODE: ${envConfig.STUB_MODE}`);
    console.log(`- AUTO_SEED: ${envConfig.AUTO_SEED}`);
    
    // Validate MongoDB URI format without logging the actual URI
    if (envConfig.MONGODB_URI) {
      const isAtlas = envConfig.MONGODB_URI.includes('mongodb+srv');
      const hasDatabase = envConfig.MONGODB_URI.split('/').length > 3;
      console.log(`- MongoDB: ${isAtlas ? 'Atlas (SRV)' : 'Standard'} connection`);
      console.log(`- Database name: ${hasDatabase ? 'Specified' : 'Missing - this may cause issues'}`);
      
      if (!hasDatabase) {
        console.warn('⚠️  Warning: MongoDB URI may be missing database name');
      }
    }
    
    return envConfig;
  } catch (error) {
    console.error('❌ Invalid environment configuration:');
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        console.error(`  ${err.path.join('.')}: ${err.message}`);
      });
    }
    process.exit(1);
  }
}

export function getEnvConfig(): EnvConfig {
  if (!envConfig) {
    return validateEnv();
  }
  return envConfig;
}