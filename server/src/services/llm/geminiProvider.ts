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
    const kb = articles.map((a, i) => `${i + 1}. ${a.title}\n${a.body.slice(0, 500)}`).join('\n\n');
    
    const prompt = `You are a professional customer support agent. Create a well-structured, helpful reply to the customer's inquiry.

Structure your response with these sections:
1. Professional greeting addressing their concern
2. **Recommended Solution:** with numbered steps
3. **Additional Resources:** referencing KB articles as [1], [2], etc.
4. **Important Notes:** category-specific guidance
5. **Follow-up:** next steps and availability
6. Professional signature

Use markdown formatting for headers and maintain a professional, empathetic tone.

Return JSON: {"draftReply": "structured_response", "citations": ["article_ids"], "confidence": 0.0-1.0}

Customer Inquiry: ${text}

Knowledge Base Articles:\n${kb}`;
    
    const result = await retry(() => model.generateContent(prompt), { retries: 2, minDelayMs: 300, maxDelayMs: 2000, timeoutMs: 15000 });
    const raw = result.response.text();
    
    let parsed: any;
    try { 
      parsed = JSON.parse(raw); 
    } catch { 
      // Fallback with structured format
      parsed = {
        draftReply: this.generateFallbackStructuredResponse(text, articles),
        citations: articles.slice(0, 3).map(a => String(a._id)),
        confidence: 0.7
      };
    }
    
    const draftReply = typeof parsed.draftReply === 'string' ? parsed.draftReply : this.generateFallbackStructuredResponse(text, articles);
    const citations = Array.isArray(parsed.citations) ? parsed.citations.slice(0, 3).map(String) : articles.slice(0, 3).map(a => String(a._id));
    const confidence = typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0.7;
    
    return { draftReply, citations, confidence } as IDraftResult;
  }

  private generateFallbackStructuredResponse(text: string, articles: IArticle[]): string {
    const lines = [];
    lines.push('Dear Valued Customer,\n');
    lines.push('Thank you for contacting our support team. I understand your concern and am here to help resolve this matter promptly.\n');
    
    lines.push('**Recommended Solution:**\n');
    lines.push('1. Review your account settings and verify all information is current');
    lines.push('2. Check our knowledge base for relevant troubleshooting guides');
    lines.push('3. Contact our support team if the issue persists\n');
    
    if (articles.length > 0) {
      lines.push('**Additional Resources:**\n');
      articles.slice(0, 3).forEach((article, idx) => {
        lines.push(`• [${article.title}](#article-${article._id})`);
      });
      lines.push('');
    }
    
    lines.push('**Follow-up:**\n');
    lines.push('Please don\'t hesitate to reach out if you need any clarification or additional assistance. We\'re committed to ensuring your complete satisfaction.\n');
    
    lines.push('Best regards,');
    lines.push('**Customer Support Team**');
    
    return lines.join('\n');
  }
}

export default GeminiLLMProvider;


