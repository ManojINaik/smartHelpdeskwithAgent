import Article from '../models/Article.js';
import { IArticle, IScoredArticle } from '../types/models.js';

export interface CreateArticleData {
  title: string;
  body: string;
  tags?: string[];
  status?: 'draft' | 'published';
  createdBy: string;
}

export interface UpdateArticleData {
  title?: string;
  body?: string;
  tags?: string[];
  status?: 'draft' | 'published';
}

export class KnowledgeBaseService {
  static async getAllArticles(includeUnpublished = false): Promise<IArticle[]> {
    const filter: any = includeUnpublished ? {} : { status: 'published' };
    return Article.find(filter).sort({ createdAt: -1 });
  }

  static async searchArticles(query: string, includeUnpublished = false): Promise<IArticle[]> {
    // If no query provided, return all published articles (or all if includeUnpublished)
    if (!query || query.trim().length === 0) {
      const filter: any = includeUnpublished ? {} : { status: 'published' };
      return Article.find(filter).sort({ createdAt: -1 }).limit(50);
    }

    // Use MongoDB text search first
    const results = await (Article as any).searchByText(query, includeUnpublished);

    // Fallback: if no results, try a simple contains search
    if (results.length === 0) {
      const filter: any = includeUnpublished ? {} : { status: 'published' };
      return Article.find({
        ...filter,
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { body: { $regex: query, $options: 'i' } },
          { tags: { $in: [query.toLowerCase()] } }
        ]
      }).limit(20);
    }

    return results;
  }

  static async createArticle(data: CreateArticleData): Promise<IArticle> {
    return Article.create({
      title: data.title,
      body: data.body,
      tags: data.tags || [],
      status: data.status || 'draft',
      createdBy: data.createdBy
    });
  }

  static async getArticle(id: string): Promise<IArticle | null> {
    return Article.findById(id);
  }

  static async updateArticle(id: string, updates: UpdateArticleData): Promise<IArticle | null> {
    const allowed: UpdateArticleData = {};
    if (typeof updates.title === 'string') allowed.title = updates.title;
    if (typeof updates.body === 'string') allowed.body = updates.body;
    if (Array.isArray(updates.tags)) allowed.tags = updates.tags;
    if (updates.status === 'draft' || updates.status === 'published') allowed.status = updates.status;

    return Article.findByIdAndUpdate(id, allowed, { new: true, runValidators: true });
  }

  static async deleteArticle(id: string): Promise<void> {
    await Article.findByIdAndDelete(id);
  }

  static async getRelevantArticles(ticketContent: string, limit: number = 3): Promise<IScoredArticle[]> {
    const query = ticketContent.trim();
    if (!query) return [];

    // Start with published only
    const candidates = await (Article as any).searchByText(query, false);

    // If minimal text search results, broaden with simple regex
    let pool = candidates;
    if (pool.length < limit) {
      const fallback = await Article.find({
        status: 'published',
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { body: { $regex: query, $options: 'i' } },
          { tags: { $in: query.toLowerCase().split(/\s+/) } }
        ]
      }).limit(25);
      pool = [...new Map([...pool, ...fallback].map(a => [String(a._id), a])).values()];
    }

    // Score and sort
    const scored: IScoredArticle[] = pool.map((article: any) => ({
      article,
      score: typeof article.getRelevanceScore === 'function' ? article.getRelevanceScore(query) : 0,
      relevanceReason: 'keyword_match'
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  }
}

export default KnowledgeBaseService;



