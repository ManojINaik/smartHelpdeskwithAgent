import ArticleEmbedding from '../models/ArticleEmbedding.js';
import Article from '../models/Article.js';
import VectorEmbeddingService from './vectorEmbedding.service.js';
import KnowledgeBaseService from './kb.service.js';

export interface AtlasRAGResult {
  articles: Array<{
    article: any;
    score: number;
    relevanceReason: string;
    searchMethod: 'vector' | 'hybrid' | 'text';
  }>;
  query: string;
  searchMethod: 'atlas-vector' | 'atlas-hybrid' | 'atlas-text' | 'fallback';
  totalMatches: number;
  executionTimeMs: number;
  atlasMetadata?: {
    vectorCandidates?: number;
    textMatches?: number;
    hybridWeight?: number;
    fallbackReason?: string;
    error?: string;
    reason?: string;
    [key: string]: any;
  };
}

export interface AtlasContextResult {
  searchQuery: string;
  articles: any[];
  totalTokens: number;
  maxContextLength: number;
  relevanceScores: number[];
  searchMetadata: {
    method: string;
    executionTime: number;
    atlasEnabled: boolean;
  };
}

export class AtlasRAGService {
  private readonly maxContextLength = 8000;
  private readonly vectorSimilarityThreshold = 0.3;
  private readonly hybridWeightVector = 0.7; // 70% vector, 30% text
  
  /**
   * Check if Atlas Vector Search is available and properly configured
   */
  async isAtlasAvailable(): Promise<boolean> {
    try {
      return await (ArticleEmbedding as any).isAtlasVectorSearchAvailable();
    } catch (error) {
      console.warn('Error checking Atlas Vector Search availability:', error);
      return false;
    }
  }

  /**
   * Get Atlas Vector Search statistics and health info
   */
  async getAtlasStats() {
    try {
      const stats = await (ArticleEmbedding as any).getVectorSearchStats();
      return {
        ...stats,
        isHealthy: stats.atlasVectorSearchAvailable && stats.properlyIndexed > 0,
        readinessScore: stats.totalEmbeddings > 0 ? (stats.properlyIndexed / stats.totalEmbeddings) : 0
      };
    } catch (error) {
      console.error('Error getting Atlas stats:', error);
      return {
        totalEmbeddings: 0,
        vectorSearchEnabled: 0,
        properlyIndexed: 0,
        atlasVectorSearchAvailable: false,
        isHealthy: false,
        readinessScore: 0
      };
    }
  }

  /**
   * Perform Atlas Vector Search with automatic fallback
   */
  async retrieveRelevantContent(
    query: string,
    limit: number = 5,
    useVectorSearch: boolean = true,
    forceAtlas: boolean = false
  ): Promise<AtlasRAGResult> {
    const startTime = Date.now();
    
    try {
      // Check if Atlas is available
      const atlasAvailable = await this.isAtlasAvailable();
      
      if (!atlasAvailable && forceAtlas) {
        throw new Error('Atlas Vector Search is not available but was forced');
      }

      // Generate query embedding
      let queryEmbedding: number[] | null = null;
      if (useVectorSearch) {
        try {
          const embeddingResult = await VectorEmbeddingService.generateEmbedding(query);
          queryEmbedding = embeddingResult.embedding;
        } catch (error) {
          console.warn('Failed to generate query embedding:', error);
        }
      }

      let results: any[] = [];
      let searchMethod: AtlasRAGResult['searchMethod'] = 'fallback';
      let atlasMetadata: AtlasRAGResult['atlasMetadata'] = {};

      // Try Atlas Vector Search first
      if (atlasAvailable && queryEmbedding && useVectorSearch) {
        try {
          results = await this.performAtlasVectorSearch(queryEmbedding, limit);
          searchMethod = 'atlas-vector';
          atlasMetadata.vectorCandidates = limit * 10;
        } catch (error) {
          console.warn('Atlas Vector Search failed, trying hybrid search:', error);
        }
      }

      // Try Atlas Hybrid Search if vector search failed or returned few results
      if (atlasAvailable && results.length < Math.ceil(limit / 2) && queryEmbedding) {
        try {
          results = await this.performAtlasHybridSearch(queryEmbedding, query, limit);
          searchMethod = 'atlas-hybrid';
          atlasMetadata.hybridWeight = this.hybridWeightVector;
        } catch (error) {
          console.warn('Atlas Hybrid Search failed, trying text search:', error);
        }
      }

      // Try Atlas Text Search if previous methods failed
      if (atlasAvailable && results.length === 0) {
        try {
          results = await this.performAtlasTextSearch(query, limit);
          searchMethod = 'atlas-text';
        } catch (error) {
          console.warn('Atlas Text Search failed, falling back to legacy search:', error);
        }
      }

      // Fallback to legacy RAG service if Atlas is not available or all methods failed
      if (results.length === 0) {
        const legacyRAGService = await import('./rag.service.js');
        const fallbackResult = await legacyRAGService.default.retrieveRelevantContent(
          query, 
          limit, 
          useVectorSearch
        );
        
        return {
          articles: fallbackResult.articles.map(item => ({
            article: item.article,
            score: item.score,
            relevanceReason: item.relevanceReason || 'Legacy search result',
            searchMethod: 'vector' as any
          })),
          query: fallbackResult.query,
          searchMethod: 'fallback' as any,
          totalMatches: fallbackResult.totalMatches,
          executionTimeMs: fallbackResult.executionTimeMs,
          atlasMetadata: { 
            reason: 'Atlas Vector Search not available or returned no results' 
          }
        };
      }

      // Process and format results
      const processedArticles = this.processSearchResults(results, query, searchMethod);
      
      return {
        articles: processedArticles,
        query,
        searchMethod,
        totalMatches: processedArticles.length,
        executionTimeMs: Date.now() - startTime,
        atlasMetadata
      };

    } catch (error) {
      console.error('AtlasRAGService error:', error);
      
      // Final fallback to legacy service
      const legacyRAGService = await import('./rag.service.js');
      const fallbackResult = await legacyRAGService.default.retrieveRelevantContent(
        query, 
        limit, 
        useVectorSearch
      );
      
      return {
        articles: fallbackResult.articles.map(item => ({
          article: item.article,
          score: item.score,
          relevanceReason: item.relevanceReason || 'Legacy fallback result',
          searchMethod: 'vector' as any
        })),
        query: fallbackResult.query,
        searchMethod: 'fallback' as any,
        totalMatches: fallbackResult.totalMatches,
        executionTimeMs: fallbackResult.executionTimeMs,
        atlasMetadata: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          fallbackReason: 'AtlasRAGService encountered an error'
        }
      };
    }
  }

  /**
   * Perform pure Atlas Vector Search
   */
  private async performAtlasVectorSearch(
    queryEmbedding: number[], 
    limit: number
  ): Promise<any[]> {
    return await (ArticleEmbedding as any).vectorSearch(
      queryEmbedding,
      limit,
      this.vectorSimilarityThreshold
    );
  }

  /**
   * Perform Atlas Hybrid Search (Vector + Text)
   */
  private async performAtlasHybridSearch(
    queryEmbedding: number[],
    textQuery: string,
    limit: number
  ): Promise<any[]> {
    return await (ArticleEmbedding as any).hybridSearch(
      queryEmbedding,
      textQuery,
      limit,
      this.hybridWeightVector
    );
  }

  /**
   * Perform Atlas Text Search
   */
  private async performAtlasTextSearch(query: string, limit: number): Promise<any[]> {
    const results = await ArticleEmbedding.find(
      { $text: { $search: query } },
      { score: { $meta: 'textScore' } }
    )
    .populate('articleId')
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit)
    .lean();

    return results
      .filter(result => result.articleId) // Ensure article exists
      .map(result => ({
        embedding: result,
        article: result.articleId,
        similarity: (result as any).score || 0.5,
        searchMethod: 'text'
      }));
  }

  /**
   * Process and format search results consistently
   */
  private processSearchResults(
    results: any[],
    query: string,
    searchMethod: string
  ): AtlasRAGResult['articles'] {
    return results.map((result, index) => {
      const article = result.article;
      const score = result.similarity || result.vectorScore || 0.5;
      
      return {
        article: {
          _id: article._id,
          title: article.title,
          body: article.body,
          tags: article.tags || [],
          status: article.status,
          createdAt: article.createdAt,
          updatedAt: article.updatedAt
        },
        score: Math.round(score * 100) / 100, // Round to 2 decimal places
        relevanceReason: this.generateRelevanceReason(score, searchMethod, index),
        searchMethod: searchMethod.replace('atlas-', '') as any
      };
    });
  }

  /**
   * Generate relevance explanation based on search method and score
   */
  private generateRelevanceReason(score: number, searchMethod: string, rank: number): string {
    const baseReason = `Rank #${rank + 1}`;
    
    if (searchMethod.includes('vector')) {
      if (score > 0.8) return `${baseReason} - High semantic similarity (${Math.round(score * 100)}%)`;
      if (score > 0.6) return `${baseReason} - Good semantic match (${Math.round(score * 100)}%)`;
      return `${baseReason} - Relevant content (${Math.round(score * 100)}%)`;
    }
    
    if (searchMethod.includes('hybrid')) {
      return `${baseReason} - Combined semantic + keyword match (${Math.round(score * 100)}%)`;
    }
    
    if (searchMethod.includes('text')) {
      return `${baseReason} - Keyword match (${Math.round(score * 100)}%)`;
    }
    
    return `${baseReason} - Similarity: ${Math.round(score * 100)}%`;
  }

  /**
   * Build enhanced context from Atlas search results
   */
  buildContext(articles: any[], query: string): AtlasContextResult {
    const startTime = Date.now();
    
    if (!articles.length) {
      return {
        searchQuery: query,
        articles: [],
        totalTokens: 0,
        maxContextLength: this.maxContextLength,
        relevanceScores: [],
        searchMetadata: {
          method: 'none',
          executionTime: Date.now() - startTime,
          atlasEnabled: false
        }
      };
    }

    // Estimate tokens (rough approximation: 1 token ≈ 4 characters)
    let totalTokens = 0;
    const contextArticles: any[] = [];
    const relevanceScores: number[] = [];

    for (const articleData of articles) {
      const article = articleData.article || articleData;
      const content = `${article.title}\n${article.body}`;
      const estimatedTokens = Math.ceil(content.length / 4);

      if (totalTokens + estimatedTokens <= this.maxContextLength) {
        contextArticles.push(article);
        totalTokens += estimatedTokens;
        relevanceScores.push(articleData.score || 0.5);
      } else {
        break;
      }
    }

    return {
      searchQuery: query,
      articles: contextArticles,
      totalTokens,
      maxContextLength: this.maxContextLength,
      relevanceScores,
      searchMetadata: {
        method: 'atlas-context',
        executionTime: Date.now() - startTime,
        atlasEnabled: true
      }
    };
  }

  /**
   * Generate embedding for a new article with Atlas optimization
   */
  async generateEmbeddingForArticle(articleId: string): Promise<void> {
    try {
      const article = await Article.findById(articleId);
      if (!article) {
        throw new Error(`Article not found: ${articleId}`);
      }

      if (article.status !== 'published') {
        console.log(`⏭️ Skipping embedding generation for non-published article: ${articleId}`);
        return;
      }

      const content = `${article.title}\n${article.body}`;
      console.log(`🔄 Generating Atlas-optimized embedding for article: ${articleId}`);

      const embeddingResult = await VectorEmbeddingService.generateEmbedding(content);

      // Ensure exactly 384 dimensions for Atlas compatibility
      if (embeddingResult.embedding.length !== 384) {
        console.warn(`⚠️ Embedding dimension mismatch for article ${articleId}: ${embeddingResult.embedding.length}, adjusting to 384`);
        // Pad or truncate to exactly 384 dimensions
        embeddingResult.embedding = embeddingResult.embedding.slice(0, 384);
        while (embeddingResult.embedding.length < 384) {
          embeddingResult.embedding.push(0);
        }
      }

      // Handle text chunking for large articles
      let chunks;
      if (content.length > 2000) {
        const textChunks = VectorEmbeddingService.chunkText(content, 1000, 100);
        const chunkEmbeddings = await VectorEmbeddingService.generateBatchEmbeddings(textChunks);
        
        chunks = textChunks.map((text, index) => ({
          text,
          embedding: chunkEmbeddings[index]?.embedding || new Array(384).fill(0),
          startIndex: content.indexOf(text),
          endIndex: content.indexOf(text) + text.length
        }));
      }

      // Save or update embedding with Atlas metadata
      await ArticleEmbedding.findOneAndUpdate(
        { articleId },
        {
          articleId,
          content,
          embedding: embeddingResult.embedding,
          embeddingModel: embeddingResult.model,
          chunks,
          lastUpdated: new Date(),
          vectorSearchEnabled: true,
          indexVersion: 'atlas-v1'
        },
        { upsert: true, new: true }
      );

      console.log(`✅ Atlas-optimized embedding saved for article: ${articleId}`);
    } catch (error) {
      console.error(`❌ Failed to generate Atlas embedding for article ${articleId}:`, error);
      throw error;
    }
  }

  /**
   * Batch generate embeddings for all published articles
   */
  async generateEmbeddingsForAllArticles(): Promise<{ processed: number; errors: number }> {
    console.log('🔄 Starting Atlas-optimized batch embedding generation for all articles...');
    
    try {
      const articles = await Article.find({ status: 'published' }).select('_id').lean();
      let processed = 0;
      let errors = 0;

      for (const article of articles) {
        try {
          await this.generateEmbeddingForArticle(article._id.toString());
          processed++;
        } catch (error) {
          console.error(`❌ Failed to generate embedding for article ${article._id}:`, error);
          errors++;
        }
      }

      console.log(`✅ Atlas batch embedding generation complete. Processed: ${processed}, Errors: ${errors}`);
      return { processed, errors };
    } catch (error) {
      console.error('❌ Batch embedding generation failed:', error);
      throw error;
    }
  }
}

// Create singleton instance
const atlasRAGService = new AtlasRAGService();
export default atlasRAGService;