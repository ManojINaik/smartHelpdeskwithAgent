import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth.js';
import RAGService from '../services/rag.service.js';
import KnowledgeBaseService from '../services/kb.service.js';

const router = Router();

// Search schema for RAG queries
const ragSearchSchema = z.object({
  query: z.string().min(1).max(1000),
  limit: z.number().min(1).max(20).optional().default(5),
  useVectorSearch: z.boolean().optional().default(true),
  forceAtlas: z.boolean().optional().default(false)
});

// RAG search endpoint
router.post('/search', authenticate, async (req, res) => {
  try {
    const { query, limit, useVectorSearch, forceAtlas } = ragSearchSchema.parse(req.body);
    
    const result = await RAGService.retrieveRelevantContent(query, limit, useVectorSearch, forceAtlas);
    
    res.json({
      success: true,
      result: {
        articles: result.articles.map(item => ({
          article: {
            _id: item.article._id,
            title: item.article.title,
            body: item.article.body.substring(0, 500) + (item.article.body.length > 500 ? '...' : ''),
            tags: item.article.tags,
            status: item.article.status,
            createdAt: item.article.createdAt,
            updatedAt: item.article.updatedAt
          },
          score: item.score,
          relevanceReason: item.relevanceReason
        })),
        query: result.query,
        searchMethod: result.searchMethod,
        totalMatches: result.totalMatches,
        executionTimeMs: result.executionTimeMs,
        atlasMetadata: result.atlasMetadata
      }
    });
  } catch (err: any) {
    res.status(400).json({ 
      success: false,
      error: { 
        code: 'RAG_SEARCH_FAILED', 
        message: err.message 
      } 
    });
  }
});

// Generate embeddings for all articles (admin only)
router.post('/embeddings/generate-all', authenticate, authorize(['admin']), async (req, res) => {
  try {
    // Start the batch process asynchronously
    RAGService.generateEmbeddingsForAllArticles()
      .then(result => {
        console.log('📊 Batch embedding generation completed:', result);
      })
      .catch(error => {
        console.error('❌ Batch embedding generation failed:', error);
      });
    
    res.json({
      success: true,
      message: 'Batch embedding generation started in background',
      note: 'Check server logs for progress updates'
    });
  } catch (err: any) {
    res.status(500).json({ 
      success: false,
      error: { 
        code: 'EMBEDDING_GENERATION_FAILED', 
        message: err.message 
      } 
    });
  }
});

// Generate embedding for specific article (admin/agent)
router.post('/embeddings/generate/:articleId', authenticate, authorize(['admin', 'agent']), async (req, res) => {
  try {
    const articleId = req.params.articleId;
    
    if (!articleId) {
      res.status(400).json({ 
        success: false,
        error: { 
          code: 'INVALID_ARTICLE_ID', 
          message: 'Article ID is required' 
        } 
      });
      return;
    }
    
    await RAGService.generateEmbeddingForArticle(articleId);
    
    res.json({
      success: true,
      message: `Embedding generated for article ${articleId}`
    });
  } catch (err: any) {
    res.status(400).json({ 
      success: false,
      error: { 
        code: 'EMBEDDING_GENERATION_FAILED', 
        message: err.message 
      } 
    });
  }
});

// Get RAG system statistics (admin only)
router.get('/stats', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const stats = await RAGService.getEmbeddingStats();
    
    res.json({
      success: true,
      stats: {
        totalArticles: stats.totalArticles,
        articlesWithEmbeddings: stats.articlesWithEmbeddings,
        embeddingsNeedingUpdate: stats.embeddingsNeedingUpdate,
        averageEmbeddingAge: Math.round(stats.averageEmbeddingAge * 100) / 100, // Round to 2 decimal places
        coveragePercentage: stats.totalArticles > 0 
          ? Math.round((stats.articlesWithEmbeddings / stats.totalArticles) * 100) 
          : 0,
        upToDatePercentage: stats.articlesWithEmbeddings > 0
          ? Math.round(((stats.articlesWithEmbeddings - stats.embeddingsNeedingUpdate) / stats.articlesWithEmbeddings) * 100)
          : 100,
        atlasStats: stats.atlasStats
      }
    });
  } catch (err: any) {
    res.status(500).json({ 
      success: false,
      error: { 
        code: 'STATS_FETCH_FAILED', 
        message: err.message 
      } 
    });
  }
});

// Test RAG context building
router.post('/test/context', authenticate, authorize(['admin', 'agent']), async (req, res) => {
  try {
    const { query, limit = 5 } = ragSearchSchema.parse(req.body);
    
    const ragResult = await RAGService.retrieveRelevantContent(query, limit, true);
    const context = RAGService.buildContext(ragResult.articles, query);
    
    res.json({
      success: true,
      context: {
        searchQuery: context.searchQuery,
        selectedArticles: context.articles.length,
        totalTokens: context.totalTokens,
        maxContextLength: context.maxContextLength,
        relevanceScores: context.relevanceScores,
        articles: context.articles.map(article => ({
          id: article._id,
          title: article.title,
          bodyPreview: article.body.substring(0, 200) + '...',
          tags: article.tags
        }))
      },
      searchInfo: {
        method: ragResult.searchMethod,
        totalMatches: ragResult.totalMatches,
        executionTimeMs: ragResult.executionTimeMs,
        atlasMetadata: ragResult.atlasMetadata
      }
    });
  } catch (err: any) {
    res.status(400).json({ 
      success: false,
      error: { 
        code: 'CONTEXT_BUILD_FAILED', 
        message: err.message 
      } 
    });
  }
});

// Delete embedding for specific article (admin only)
router.delete('/embeddings/:articleId', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const articleId = req.params.articleId;
    
    if (!articleId) {
      res.status(400).json({ 
        success: false,
        error: { 
          code: 'INVALID_ARTICLE_ID', 
          message: 'Article ID is required' 
        } 
      });
      return;
    }
    
    await RAGService.deleteEmbeddingForArticle(articleId);
    
    res.json({
      success: true,
      message: `Embedding deleted for article ${articleId}`
    });
  } catch (err: any) {
    res.status(400).json({ 
      success: false,
      error: { 
        code: 'EMBEDDING_DELETION_FAILED', 
        message: err.message 
      } 
    });
  }
});

// Atlas Vector Search specific endpoints

// Get Atlas Vector Search health and availability (admin only)
router.get('/atlas/health', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const atlasStats = await RAGService.getAtlasStats();
    
    res.json({
      success: true,
      atlas: {
        available: atlasStats.atlasVectorSearchAvailable,
        healthy: atlasStats.isHealthy,
        readinessScore: atlasStats.readinessScore,
        stats: {
          totalEmbeddings: atlasStats.totalEmbeddings,
          vectorSearchEnabled: atlasStats.vectorSearchEnabled,
          properlyIndexed: atlasStats.properlyIndexed
        },
        recommendations: atlasStats.isHealthy 
          ? ['Atlas Vector Search is operational']
          : [
              atlasStats.totalEmbeddings === 0 ? 'Generate embeddings for articles' : null,
              atlasStats.properlyIndexed === 0 ? 'Check Atlas Vector Search index configuration' : null,
              !atlasStats.atlasVectorSearchAvailable ? 'Enable Atlas Vector Search in MongoDB Atlas' : null
            ].filter(Boolean)
      }
    });
  } catch (err: any) {
    res.status(500).json({ 
      success: false,
      error: { 
        code: 'ATLAS_HEALTH_CHECK_FAILED', 
        message: err.message 
      } 
    });
  }
});

// Force Atlas Vector Search (admin only) - for testing
router.post('/atlas/search', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { query, limit = 5 } = ragSearchSchema.parse(req.body);
    
    // Force Atlas search
    const result = await RAGService.retrieveRelevantContent(query, limit, true, true);
    
    res.json({
      success: true,
      result: {
        articles: result.articles.map(item => ({
          article: {
            _id: item.article._id,
            title: item.article.title,
            body: item.article.body.substring(0, 500) + (item.article.body.length > 500 ? '...' : ''),
            tags: item.article.tags,
            status: item.article.status,
            createdAt: item.article.createdAt,
            updatedAt: item.article.updatedAt
          },
          score: item.score,
          relevanceReason: item.relevanceReason
        })),
        query: result.query,
        searchMethod: result.searchMethod,
        totalMatches: result.totalMatches,
        executionTimeMs: result.executionTimeMs,
        atlasMetadata: result.atlasMetadata,
        performanceGain: result.searchMethod.startsWith('atlas-') 
          ? `${Math.round((1 - result.executionTimeMs / 1000) * 100)}% faster than legacy search`
          : 'Atlas search not used'
      },
      note: 'This endpoint forces Atlas Vector Search usage for testing purposes'
    });
  } catch (err: any) {
    res.status(400).json({ 
      success: false,
      error: { 
        code: 'ATLAS_SEARCH_FAILED', 
        message: err.message 
      } 
    });
  }
});

// Compare search methods (admin only) - for performance analysis
router.post('/compare', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { query, limit = 5 } = ragSearchSchema.parse(req.body);
    
    // Run both Atlas and legacy searches in parallel
    const [atlasResult, legacyResult] = await Promise.allSettled([
      RAGService.retrieveRelevantContent(query, limit, true, true), // Force Atlas
      RAGService.retrieveRelevantContent(query, limit, false)        // Legacy keyword
    ]);
    
    const comparison: any = {
      query,
      atlas: atlasResult.status === 'fulfilled' ? {
        success: true,
        searchMethod: atlasResult.value.searchMethod,
        totalMatches: atlasResult.value.totalMatches,
        executionTimeMs: atlasResult.value.executionTimeMs,
        topScores: atlasResult.value.articles.slice(0, 3).map(a => a.score),
        atlasMetadata: atlasResult.value.atlasMetadata
      } : {
        success: false,
        error: atlasResult.reason instanceof Error ? atlasResult.reason.message : 'Unknown error'
      },
      legacy: legacyResult.status === 'fulfilled' ? {
        success: true,
        searchMethod: legacyResult.value.searchMethod,
        totalMatches: legacyResult.value.totalMatches,
        executionTimeMs: legacyResult.value.executionTimeMs,
        topScores: legacyResult.value.articles.slice(0, 3).map(a => a.score)
      } : {
        success: false,
        error: legacyResult.reason instanceof Error ? legacyResult.reason.message : 'Unknown error'
      }
    };
    
    // Calculate performance improvement
    if (comparison.atlas.success && comparison.legacy.success) {
      const atlasTime = comparison.atlas.executionTimeMs || 1000;
      const legacyTime = comparison.legacy.executionTimeMs || 1000;
      const speedImprovement = ((legacyTime - atlasTime) / legacyTime) * 100;
      comparison.performanceAnalysis = {
        speedImprovement: `${Math.round(speedImprovement)}% ${speedImprovement > 0 ? 'faster' : 'slower'}`,
        atlasAdvantages: speedImprovement > 0 ? ['Faster execution', 'Better semantic understanding'] : [],
        recommendation: speedImprovement > 10 
          ? 'Recommend using Atlas Vector Search for production'
          : 'Performance gains are marginal, both methods are viable'
      };
    }
    
    res.json({
      success: true,
      comparison
    });
  } catch (err: any) {
    res.status(500).json({ 
      success: false,
      error: { 
        code: 'COMPARISON_FAILED', 
        message: err.message 
      } 
    });
  }
});

export default router;