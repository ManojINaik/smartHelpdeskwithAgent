import Article from '../models/Article.js';
import ArticleEmbedding from '../models/ArticleEmbedding.js';
import VectorEmbeddingService from './vectorEmbedding.service.js';
import { IArticle, IScoredArticle } from '../types/models.js';

// Import Atlas RAG service for enhanced capabilities
let atlasRAGService: any = null;
async function getAtlasRAGService() {
  if (!atlasRAGService) {
    try {
      const module = await import('./atlasRag.service.js');
      atlasRAGService = module.default;
    } catch (error) {
      console.warn('Atlas RAG Service not available:', error);
    }
  }
  return atlasRAGService;
}

export interface RAGResult {
  articles: IScoredArticle[];
  query: string;
  searchMethod: 'vector' | 'hybrid' | 'keyword' | 'atlas-vector' | 'atlas-hybrid' | 'atlas-text';
  totalMatches: number;
  executionTimeMs: number;
  atlasMetadata?: {
    vectorCandidates?: number;
    textMatches?: number;
    hybridWeight?: number;
    fallbackReason?: string;
    atlasEnabled?: boolean;
  };
}

export interface RAGContext {
  articles: IArticle[];
  relevanceScores: number[];
  searchQuery: string;
  totalTokens: number;
  maxContextLength: number;
  searchMetadata?: {
    method: string;
    executionTime: number;
    atlasEnabled: boolean;
  };
}

export class RAGService {
  private readonly maxContextLength: number = 8000; // Max context tokens for LLM
  private readonly vectorSimilarityThreshold: number = 0.3;
  private readonly hybridWeightVector: number = 0.7; // Vector vs keyword search weight
  private atlasAvailable: boolean | null = null;
  private atlasCheckTime: number = 0;
  private readonly atlasCheckInterval = 5 * 60 * 1000; // Check Atlas availability every 5 minutes
  
  /**
   * Check if Atlas Vector Search is available and cache the result
   */
  private async checkAtlasAvailability(): Promise<boolean> {
    const now = Date.now();
    
    // Return cached result if recent
    if (this.atlasAvailable !== null && (now - this.atlasCheckTime) < this.atlasCheckInterval) {
      return this.atlasAvailable;
    }
    
    try {
      const atlasService = await getAtlasRAGService();
      if (atlasService) {
        this.atlasAvailable = await atlasService.isAtlasAvailable();
      } else {
        this.atlasAvailable = false;
      }
    } catch (error) {
      console.warn('Error checking Atlas Vector Search availability:', error);
      this.atlasAvailable = false;
    }
    
    this.atlasCheckTime = now;
    return this.atlasAvailable ?? false;
  }
  
  /**
   * Get Atlas Vector Search statistics
   */
  async getAtlasStats() {
    try {
      const atlasService = await getAtlasRAGService();
      if (atlasService) {
        return await atlasService.getAtlasStats();
      }
    } catch (error) {
      console.warn('Error getting Atlas stats:', error);
    }
    
    return {
      totalEmbeddings: 0,
      vectorSearchEnabled: 0,
      properlyIndexed: 0,
      atlasVectorSearchAvailable: false,
      isHealthy: false,
      readinessScore: 0
    };
  }
  
  /**
   * Retrieve relevant articles using RAG approach with Atlas Vector Search integration
   */
  async retrieveRelevantContent(
    query: string, 
    limit: number = 5,
    useVectorSearch: boolean = true,
    forceAtlas: boolean = false
  ): Promise<RAGResult> {
    const startTime = Date.now();
    
    if (!query || query.trim().length === 0) {
      return {
        articles: [],
        query,
        searchMethod: 'keyword',
        totalMatches: 0,
        executionTimeMs: Date.now() - startTime,
        atlasMetadata: { atlasEnabled: false }
      };
    }
    
    // Check Atlas availability
    const atlasAvailable = await this.checkAtlasAvailability();
    
    // Try Atlas Vector Search first if available
    if (atlasAvailable && useVectorSearch) {
      try {
        const atlasService = await getAtlasRAGService();
        if (atlasService) {
          const atlasResult = await atlasService.retrieveRelevantContent(
            query, 
            limit, 
            useVectorSearch, 
            forceAtlas
          );
          
          // Convert Atlas result format to RAG result format
          return {
            articles: atlasResult.articles.map((item: any) => ({
              article: item.article,
              score: item.score,
              relevanceReason: item.relevanceReason
            })),
            query: atlasResult.query,
            searchMethod: atlasResult.searchMethod,
            totalMatches: atlasResult.totalMatches,
            executionTimeMs: atlasResult.executionTimeMs,
            atlasMetadata: {
              ...atlasResult.atlasMetadata,
              atlasEnabled: true
            }
          };
        }
      } catch (error) {
        console.warn('Atlas Vector Search failed, falling back to legacy RAG:', error);
        
        // Continue with legacy implementation if Atlas fails
      }
    }
    
    // Legacy RAG implementation
    let articles: IScoredArticle[] = [];
    let searchMethod: RAGResult['searchMethod'] = 'keyword';
    
    try {
      if (useVectorSearch) {
        // Try vector search first
        const vectorResults = await this.vectorSearch(query, limit);
        
        if (vectorResults.length >= Math.min(3, limit)) {
          // Good vector results, use them
          articles = vectorResults;
          searchMethod = 'vector';
        } else {
          // Fallback to hybrid search
          articles = await this.hybridSearch(query, limit);
          searchMethod = 'hybrid';
        }
      } else {
        // Use traditional keyword search
        articles = await this.keywordSearch(query, limit);
        searchMethod = 'keyword';
      }
    } catch (error) {
      console.error('RAG search error, falling back to keyword search:', error);
      articles = await this.keywordSearch(query, limit);
      searchMethod = 'keyword';
    }
    
    return {
      articles,
      query,
      searchMethod,
      totalMatches: articles.length,
      executionTimeMs: Date.now() - startTime,
      atlasMetadata: {
        atlasEnabled: atlasAvailable,
        fallbackReason: atlasAvailable ? 'Atlas search failed' : 'Atlas not available'
      }
    };
  }
  
  /**
   * Vector-based semantic search
   */
  private async vectorSearch(query: string, limit: number): Promise<IScoredArticle[]> {
    // Generate embedding for query
    const queryEmbedding = await VectorEmbeddingService.generateEmbedding(query);
    
    // Find similar articles using vector similarity
    const similarArticles = await (ArticleEmbedding as any).findSimilar(
      queryEmbedding.embedding,
      limit * 2, // Get more candidates
      this.vectorSimilarityThreshold
    );
    
    const results: IScoredArticle[] = [];
    
    for (const item of similarArticles.slice(0, limit)) {
      if (item.embedding.articleId) {
        try {
          const article = await Article.findById(item.embedding.articleId);
          if (article && article.status === 'published') {
            results.push({
              article,
              score: item.similarity * 100, // Convert to 0-100 scale
              relevanceReason: `Vector similarity: ${(item.similarity * 100).toFixed(1)}%`
            });
          }
        } catch (error) {
          console.error('Error fetching article for vector result:', error);
        }
      }
    }
    
    return results;
  }
  
  /**
   * Hybrid search combining vector and keyword approaches
   */
  private async hybridSearch(query: string, limit: number): Promise<IScoredArticle[]> {
    // Get results from both methods
    const [vectorResults, keywordResults] = await Promise.all([
      this.vectorSearch(query, Math.ceil(limit * 0.7)),
      this.keywordSearch(query, Math.ceil(limit * 0.7))
    ]);
    
    // Combine and deduplicate results
    const combinedResults = new Map<string, IScoredArticle>();
    
    // Add vector results with higher weight
    vectorResults.forEach(result => {
      const id = String(result.article._id);
      combinedResults.set(id, {
        ...result,
        score: result.score * this.hybridWeightVector,
        relevanceReason: `Hybrid: Vector (${this.hybridWeightVector * 100}%) + ${result.relevanceReason}`
      });
    });
    
    // Add keyword results, merging scores if already exists
    keywordResults.forEach(result => {
      const id = String(result.article._id);
      const existing = combinedResults.get(id);
      
      if (existing) {
        // Merge scores
        existing.score = existing.score + (result.score * (1 - this.hybridWeightVector));
        existing.relevanceReason = `Hybrid: Vector + Keyword match`;
      } else {
        combinedResults.set(id, {
          ...result,
          score: result.score * (1 - this.hybridWeightVector),
          relevanceReason: `Hybrid: Keyword (${(1 - this.hybridWeightVector) * 100}%) + ${result.relevanceReason}`
        });
      }
    });
    
    // Sort by combined score and return top results
    return Array.from(combinedResults.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
  
  /**
   * Traditional keyword-based search
   */
  private async keywordSearch(query: string, limit: number): Promise<IScoredArticle[]> {
    try {
      // Use MongoDB text search first
      const textSearchResults = await (Article as any).searchByText(query, false);
      
      if (textSearchResults.length > 0) {
        return textSearchResults.slice(0, limit).map((article: IArticle) => ({
          article,
          score: typeof (article as any).getRelevanceScore === 'function' 
            ? (article as any).getRelevanceScore(query) 
            : 50,
          relevanceReason: 'MongoDB text search'
        }));
      }
      
      // Fallback to regex search
      const regexResults = await Article.find({
        status: 'published',
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { body: { $regex: query, $options: 'i' } },
          { tags: { $in: query.toLowerCase().split(/\s+/) } }
        ]
      }).limit(limit);
      
      return regexResults.map(article => ({
        article,
        score: typeof (article as any).getRelevanceScore === 'function' 
          ? (article as any).getRelevanceScore(query) 
          : 30,
        relevanceReason: 'Keyword match (regex)'
      }));
      
    } catch (error) {
      console.error('Keyword search error:', error);
      return [];
    }
  }
  
  /**
   * Build context for LLM with relevant articles - Enhanced with Atlas metadata
   */
  buildContext(articles: IScoredArticle[], query: string): RAGContext {
    const startTime = Date.now();
    let totalTokens = 0;
    const selectedArticles: IArticle[] = [];
    const relevanceScores: number[] = [];
    
    // Estimate tokens (rough approximation: 1 token ≈ 4 characters)
    const estimateTokens = (text: string): number => Math.ceil(text.length / 4);
    
    for (const scoredArticle of articles) {
      const article = scoredArticle.article;
      const articleTokens = estimateTokens(article.title + ' ' + article.body);
      
      if (totalTokens + articleTokens <= this.maxContextLength) {
        selectedArticles.push(article);
        relevanceScores.push(scoredArticle.score);
        totalTokens += articleTokens;
      } else {
        break; // Stop adding articles if we exceed context length
      }
    }
    
    return {
      articles: selectedArticles,
      relevanceScores,
      searchQuery: query,
      totalTokens,
      maxContextLength: this.maxContextLength,
      searchMetadata: {
        method: 'legacy-context',
        executionTime: Date.now() - startTime,
        atlasEnabled: this.atlasAvailable ?? false
      }
    };
  }
  
  /**
   * Generate embeddings for all articles with Atlas optimization
   */
  async generateEmbeddingsForAllArticles(): Promise<{ processed: number; errors: number }> {
    console.log('🔄 Starting batch embedding generation for all articles...');
    
    // Try Atlas service first if available
    const atlasService = await getAtlasRAGService();
    if (atlasService && await this.checkAtlasAvailability()) {
      try {
        console.log('📊 Using Atlas-optimized batch embedding generation...');
        return await atlasService.generateEmbeddingsForAllArticles();
      } catch (error) {
        console.warn('Atlas batch embedding failed, falling back to legacy method:', error);
      }
    }
    
    // Legacy implementation
    const articles = await Article.find({ status: 'published' });
    let processed = 0;
    let errors = 0;
    
    for (const article of articles) {
      try {
        await this.generateEmbeddingForArticle(String(article._id));
        processed++;
        
        if (processed % 10 === 0) {
          console.log(`📊 Processed embeddings for ${processed}/${articles.length} articles`);
        }
      } catch (error) {
        console.error(`❌ Failed to generate embedding for article ${article._id}:`, error);
        errors++;
      }
      
      // Small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`✅ Batch embedding generation complete. Processed: ${processed}, Errors: ${errors}`);
    return { processed, errors };
  }
  
  /**
   * Generate or update embedding for a specific article with Atlas optimization
   */
  async generateEmbeddingForArticle(articleId: string): Promise<void> {
    // Try Atlas service first if available
    const atlasService = await getAtlasRAGService();
    if (atlasService && await this.checkAtlasAvailability()) {
      try {
        await atlasService.generateEmbeddingForArticle(articleId);
        return;
      } catch (error) {
        console.warn(`Atlas embedding generation failed for article ${articleId}, using legacy method:`, error);
      }
    }
    
    // Legacy implementation
    const article = await Article.findById(articleId);
    if (!article) {
      throw new Error(`Article not found: ${articleId}`);
    }
    
    // Combine title and body for embedding
    const content = `${article.title}\n\n${article.body}`;
    
    // Check if embedding already exists and is recent
    const existingEmbedding = await (ArticleEmbedding as any).findOne({ articleId });
    const articleUpdated = article.updatedAt;
    
    if (existingEmbedding && existingEmbedding.lastUpdated >= articleUpdated) {
      // Embedding is up to date
      return;
    }
    
    // Generate new embedding
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
    
    // Handle large articles by chunking
    let chunks = undefined;
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
    await (ArticleEmbedding as any).findOneAndUpdate(
      { articleId },
      {
        articleId,
        content: content.substring(0, 10000), // Limit stored content
        embedding: embeddingResult.embedding,
        embeddingModel: embeddingResult.model,
        chunks,
        lastUpdated: new Date(),
        vectorSearchEnabled: true,
        indexVersion: 'atlas-v1'
      },
      { upsert: true, new: true }
    );
  }
  
  /**
   * Delete embedding for an article
   */
  async deleteEmbeddingForArticle(articleId: string): Promise<void> {
    await (ArticleEmbedding as any).findOneAndDelete({ articleId });
  }
  
  /**
   * Get comprehensive embedding statistics including Atlas metrics
   */
  async getEmbeddingStats(): Promise<{
    totalArticles: number;
    articlesWithEmbeddings: number;
    embeddingsNeedingUpdate: number;
    averageEmbeddingAge: number;
    atlasStats?: any;
  }> {
    const [totalArticles, totalEmbeddings, articles] = await Promise.all([
      Article.countDocuments({ status: 'published' }),
      (ArticleEmbedding as any).countDocuments(),
      Article.find({ status: 'published' }, 'updatedAt')
    ]);
    
    const embeddings = await (ArticleEmbedding as any).find({}, 'articleId lastUpdated');
    
    let embeddingsNeedingUpdate = 0;
    let totalAge = 0;
    
    for (const article of articles) {
      const embedding = embeddings.find((e: any) => String(e.articleId) === String(article._id));
      
      if (!embedding) {
        embeddingsNeedingUpdate++;
      } else {
        if (embedding.lastUpdated < article.updatedAt) {
          embeddingsNeedingUpdate++;
        }
        
        const age = Date.now() - embedding.lastUpdated.getTime();
        totalAge += age;
      }
    }
    
    const averageEmbeddingAge = totalEmbeddings > 0 
      ? totalAge / (totalEmbeddings * 24 * 60 * 60 * 1000) // Convert to days
      : 0;
    
    // Get Atlas stats if available
    const atlasStats = await this.getAtlasStats();
    
    return {
      totalArticles,
      articlesWithEmbeddings: totalEmbeddings,
      embeddingsNeedingUpdate,
      averageEmbeddingAge,
      atlasStats: atlasStats.atlasVectorSearchAvailable ? atlasStats : undefined
    };
  }
}

export default new RAGService();