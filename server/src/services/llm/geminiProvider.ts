import { GoogleGenerativeAI } from '@google/generative-ai';
import { getEnvConfig } from '../../config/env.js';
import { IArticle, IClassificationResult, IDraftResult } from '../../types/models.js';
import { LLMProvider } from './types.js';
import { retry } from '../../utils/retry.js';

export class GeminiLLMProvider implements LLMProvider {
  private genAI: GoogleGenerativeAI;
  private modelName = 'gemini-2.0-flash';

  constructor() {
    const env = getEnvConfig();
    if (!env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required for GeminiLLMProvider');
    }
    this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  }

  isStubMode(): boolean { return false; }

  async classify(text: string): Promise<IClassificationResult> {
    const model = this.genAI.getGenerativeModel({ model: this.modelName });
    const prompt = `You are a classifier. Given the ticket text, output a compact JSON: {"predictedCategory":"billing|tech|shipping|other","confidence":0-1}.
Ticket: ${text}`;
    const result = await retry(() => model.generateContent(prompt), { retries: 2, minDelayMs: 300, maxDelayMs: 2000, timeoutMs: 12000 });
    const raw = result.response.text();
    let parsed: any;
    try { parsed = JSON.parse(raw); } catch { parsed = {}; }
    const predictedCategory = ['billing','tech','shipping','other'].includes(parsed.predictedCategory) ? parsed.predictedCategory : 'other';
    const confidence = typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0.6;
    return { predictedCategory, confidence } as IClassificationResult;
  }

  async draft(text: string, articles: IArticle[]): Promise<IDraftResult> {
    const model = this.genAI.getGenerativeModel({ model: this.modelName });
    const kb = articles.map((a, i) => `${i + 1}. ${a.title}\n${a.body.slice(0, 500)}`).join('\n');
    const prompt = `Draft a short helpful reply to the user's ticket, citing the provided KB items numerically [1], [2], [3].
Return JSON: {"draftReply": string, "citations": string[], "confidence": number}.
Ticket: ${text}
KB:\n${kb}`;
    const result = await retry(() => model.generateContent(prompt), { retries: 2, minDelayMs: 300, maxDelayMs: 2000, timeoutMs: 15000 });
    const raw = result.response.text();
    let parsed: any;
    try { parsed = JSON.parse(raw); } catch { parsed = {}; }
    const draftReply = typeof parsed.draftReply === 'string' ? parsed.draftReply : 'Based on our knowledge base, here\'s a suggested reply.';
    const citations = Array.isArray(parsed.citations) ? parsed.citations.slice(0, 3).map(String) : articles.slice(0,3).map(a => String(a._id));
    const confidence = typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0.7;
    return { draftReply, citations, confidence } as IDraftResult;
  }
}

export default GeminiLLMProvider;


