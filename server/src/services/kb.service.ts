import Article from '../models/Article.js';
import { IArticle, IScoredArticle } from '../types/models.js';
import RAGService from './rag.service.js';
import VectorEmbeddingService from './vectorEmbedding.service.js';

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
    const article = await Article.create({
      title: data.title,
      body: data.body,
      tags: data.tags || [],
      status: data.status || 'draft',
      createdBy: data.createdBy
    });

    // Generate embedding if article is published
    if (article.status === 'published') {
      this.generateEmbeddingAsync(String(article._id));
    }

    return article;
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

    const oldArticle = await Article.findById(id);
    const updatedArticle = await Article.findByIdAndUpdate(id, allowed, { new: true, runValidators: true });
    
    if (updatedArticle) {
      // Handle embedding updates based on status changes
      const wasPublished = oldArticle?.status === 'published';
      const isNowPublished = updatedArticle.status === 'published';
      
      if (isNowPublished && (!wasPublished || this.hasContentChanged(oldArticle, updatedArticle))) {
        // Generate/update embedding for newly published or modified articles
        this.generateEmbeddingAsync(id);
      } else if (wasPublished && !isNowPublished) {
        // Remove embedding if article is no longer published
        this.deleteEmbeddingAsync(id);
      }
    }

    return updatedArticle;
  }

  static async deleteArticle(id: string): Promise<void> {
    await Article.findByIdAndDelete(id);
    // Clean up associated embedding
    this.deleteEmbeddingAsync(id);
  }

  /**
   * RAG Management Methods
   */
  
  /**
   * Generate embeddings for all published articles
   */
  static async generateAllEmbeddings(): Promise<{ processed: number; errors: number }> {
    return RAGService.generateEmbeddingsForAllArticles();
  }
  
  /**
   * Get RAG system statistics
   */
  static async getRAGStats() {
    return RAGService.getEmbeddingStats();
  }
  
  /**
   * Utility Methods
   */
  
  private static generateEmbeddingAsync(articleId: string): void {
    // Generate embedding asynchronously without blocking the response
    RAGService.generateEmbeddingForArticle(articleId)
      .then(() => {
        console.log(`✅ Generated embedding for article ${articleId}`);
      })
      .catch(error => {
        console.error(`❌ Failed to generate embedding for article ${articleId}:`, error);
      });
  }
  
  private static deleteEmbeddingAsync(articleId: string): void {
    // Delete embedding asynchronously
    RAGService.deleteEmbeddingForArticle(articleId)
      .then(() => {
        console.log(`🗑️ Deleted embedding for article ${articleId}`);
      })
      .catch(error => {
        console.error(`❌ Failed to delete embedding for article ${articleId}:`, error);
      });
  }
  
  private static hasContentChanged(oldArticle: IArticle | null, newArticle: IArticle): boolean {
    if (!oldArticle) return true;
    
    return (
      oldArticle.title !== newArticle.title ||
      oldArticle.body !== newArticle.body ||
      JSON.stringify(oldArticle.tags) !== JSON.stringify(newArticle.tags)
    );
  }

  static async getRelevantArticles(ticketContent: string, limit: number = 3): Promise<IScoredArticle[]> {
    const query = ticketContent.trim();
    if (!query) return [];

    try {
      // Use RAG service for enhanced semantic search
      const ragResult = await RAGService.retrieveRelevantContent(query, limit, true);
      
      console.log(`📊 RAG Search Results for query "${query.substring(0, 50)}...":`, {
        method: ragResult.searchMethod,
        matches: ragResult.totalMatches,
        executionTime: ragResult.executionTimeMs + 'ms'
      });
      
      if (ragResult.articles.length > 0) {
        return ragResult.articles;
      }
    } catch (error) {
      console.error('RAG search failed, falling back to traditional search:', error);
    }

    // Fallback to traditional search if RAG fails
    return this.getFallbackRelevantArticles(query, limit);
  }

  /**
   * Fallback method using traditional keyword search
   */
  private static async getFallbackRelevantArticles(ticketContent: string, limit: number = 3): Promise<IScoredArticle[]> {
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



