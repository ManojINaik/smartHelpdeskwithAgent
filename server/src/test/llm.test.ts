import { describe, it, expect } from 'vitest';
import { getLLMProvider } from '../services/llm/index.js';
import { IArticle } from '../types/models.js';

describe('LLM Provider (stub mode)', () => {
  it('classifies using deterministic heuristics', async () => {
    process.env.LLM_PROVIDER = 'stub';
    process.env.STUB_MODE = 'true';
    const provider = getLLMProvider();
    const res = await provider.classify('I need a refund for a double charge');
    expect(['billing','tech','shipping','other']).toContain(res.predictedCategory);
    expect(res.confidence).toBeGreaterThan(0);
  });

  it('drafts reply with citations', async () => {
    const provider = getLLMProvider();
    const articles = [
      { _id: '1' as any, title: 'Refund policy', body: 'Steps to refund ...', tags: [], status: 'published', createdBy: 'u' as any, createdAt: new Date(), updatedAt: new Date() },
      { _id: '2' as any, title: 'Payment troubleshooting', body: 'If payment fails ...', tags: [], status: 'published', createdBy: 'u' as any, createdAt: new Date(), updatedAt: new Date() },
    ] as unknown as IArticle[];
    const res = await provider.draft('I was overcharged', articles);
    expect(res.draftReply.length).toBeGreaterThan(0);
    expect(res.citations.length).toBeGreaterThan(0);
  });
});



