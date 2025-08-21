import { IArticle, IClassificationResult, IDraftResult } from '../../types/models.js';

const BILLING_KEYWORDS = ['refund', 'invoice', 'charge', 'payment', 'billing', 'credit', 'card'];
const TECH_KEYWORDS = ['error', 'bug', 'stack', 'crash', 'exception', '500', '404', 'not working', 'issue'];
const SHIPPING_KEYWORDS = ['delivery', 'shipment', 'shipping', 'tracking', 'package', 'courier'];

function keywordMatchScore(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  let hits = 0;
  for (const k of keywords) {
    if (lower.includes(k)) hits += 1;
  }
  return hits;
}

function computeConfidence(maxHits: number): number {
  if (maxHits >= 3) return 0.92;
  if (maxHits === 2) return 0.82;
  if (maxHits === 1) return 0.68;
  return 0.35;
}

export class StubLLMProvider {
  isStubMode(): boolean { return true; }

  async classify(text: string): Promise<IClassificationResult> {
    const b = keywordMatchScore(text, BILLING_KEYWORDS);
    const t = keywordMatchScore(text, TECH_KEYWORDS);
    const s = keywordMatchScore(text, SHIPPING_KEYWORDS);

    let predictedCategory: 'billing' | 'tech' | 'shipping' | 'other' = 'other';
    let maxHits = b;
    if (t > maxHits) { predictedCategory = 'tech'; maxHits = t; }
    if (s > maxHits) { predictedCategory = 'shipping'; maxHits = s; }
    if (b > t && b > s) predictedCategory = 'billing';
    if (b === 0 && t === 0 && s === 0) predictedCategory = 'other';

    const confidence = computeConfidence(Math.max(b, t, s));
    return { predictedCategory, confidence };
  }

  async draft(text: string, articles: IArticle[]): Promise<IDraftResult> {
    const lines: string[] = [];
    lines.push('Thanks for reaching out. Here\'s a suggested reply based on our knowledge base:');
    lines.push('');
    const citations: string[] = [];
    articles.slice(0, 3).forEach((a, idx) => {
      lines.push(`${idx + 1}. ${a.title}`);
      citations.push(String(a._id));
    });
    lines.push('');
    lines.push('If this addresses your issue, we can proceed to resolve the ticket.');
    const draftReply = lines.join('\n');

    // Confidence biased by article count
    const confidence = Math.min(0.95, 0.6 + (articles.length * 0.1));
    return { draftReply, citations, confidence };
  }
}

export default StubLLMProvider;


