import { getEnvConfig } from '../../config/env.js';
import { LLMProvider } from './types.js';
import StubLLMProvider from './stubProvider.js';
import GeminiLLMProvider from './geminiProvider.js';

export function getLLMProvider(): LLMProvider {
  const env = getEnvConfig();
  if (env.LLM_PROVIDER === 'stub' || env.STUB_MODE) {
    return new StubLLMProvider();
  }
  return new GeminiLLMProvider();
}


