import { describe, it, expect } from 'vitest';
import { validateEnv } from '../config/env';

describe('Environment Configuration', () => {
  it('should validate environment variables', () => {
    const config = validateEnv();
    
    expect(config.NODE_ENV).toBe('test');
    expect(config.PORT).toBeTypeOf('number');
    expect(config.JWT_SECRET.length).toBeGreaterThanOrEqual(32);
    expect(config.LLM_PROVIDER).toBe('stub');
    expect(config.AUTO_CLOSE_ENABLED).toBeTypeOf('boolean');
    expect(config.CONFIDENCE_THRESHOLD).toBeTypeOf('number');
  });
});