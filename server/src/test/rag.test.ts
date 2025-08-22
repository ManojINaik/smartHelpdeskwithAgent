import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from './server.mock.js';
import mongoose from 'mongoose';
import Article from '../models/Article.js';
import ArticleEmbedding from '../models/ArticleEmbedding.js';
import VectorEmbeddingService from '../services/vectorEmbedding.service.js';
import RAGService from '../services/rag.service.js';
import AtlasRAGService from '../services/atlasRag.service.js';
import { getAtlasConfig } from '../config/atlas.js';

describe('RAG System Tests', () => {
  let adminToken: string;
  let agentToken: string;
  let userToken: string;
  let articleId: string;

  beforeAll(async () => {
    // Create test users with different roles
    const adminEmail = `admin${Date.now()}@example.com`;
    const agentEmail = `agent${Date.now()}@example.com`;
    const userEmail = `user${Date.now()}@example.com`;

    const adminReg = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Admin', email: adminEmail, password: 'Password123!', role: 'admin' });
    adminToken = adminReg.body.accessToken;

    const agentReg = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Agent', email: agentEmail, password: 'Password123!', role: 'agent' });
    agentToken = agentReg.body.accessToken;

    const userReg = await request(app)
      .post('/api/auth/register')
      .send({ name: 'User', email: userEmail, password: 'Password123!' });
    userToken = userReg.body.accessToken;
  });

  beforeEach(async () => {
    // Clean up test data
    await Article.deleteMany({});
    await ArticleEmbedding.deleteMany({});
  });

  afterAll(async () => {
    // Clean up
    await Article.deleteMany({});
    await ArticleEmbedding.deleteMany({});
  });

  describe('Vector Embedding Service', () => {
    it('should generate embeddings for text', async () => {
      const text = 'How to process a refund for billing issues';
      const result = await VectorEmbeddingService.generateEmbedding(text);

      expect(result).toHaveProperty('embedding');
      expect(result).toHaveProperty('model', 'local-embeddings-v1');
      expect(result).toHaveProperty('dimensions', 384);
      expect(result.embedding).toHaveLength(384);
      expect(result.embedding.every(val => typeof val === 'number')).toBe(true);
    });

    it('should calculate cosine similarity correctly', () => {
      const embedding1 = [1, 0, 0];
      const embedding2 = [0, 1, 0];
      const embedding3 = [1, 0, 0];

      const similarity1 = VectorEmbeddingService.cosineSimilarity(embedding1, embedding2);
      const similarity2 = VectorEmbeddingService.cosineSimilarity(embedding1, embedding3);

      expect(similarity1).toBe(0); // Perpendicular vectors
      expect(similarity2).toBe(1); // Identical vectors
    });

    it('should chunk large text appropriately', () => {
      const largeText = 'This is a sentence. '.repeat(100); // ~2000 characters
      const chunks = VectorEmbeddingService.chunkText(largeText, 500, 50);

      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks.every(chunk => chunk.length <= 550)).toBe(true); // Allow for overlap
      expect(chunks.every(chunk => chunk.length > 10)).toBe(true);
    });

    it('should generate batch embeddings', async () => {
      const texts = [
        'Billing issue with refund',
        'Technical problem with login',
        'Shipping delay inquiry'
      ];

      const results = await VectorEmbeddingService.generateBatchEmbeddings(texts);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toHaveProperty('embedding');
        expect(result.embedding).toHaveLength(384);
      });
    });
  });

  describe('Article Embedding Model', () => {
    beforeEach(async () => {
      // Create a test article
      const article = await Article.create({
        title: 'How to Process Refunds',
        body: 'Step 1: Check the order status. Step 2: Verify payment method. Step 3: Process the refund through our billing system.',
        tags: ['billing', 'refund', 'payment'],
        status: 'published',
        createdBy: new mongoose.Types.ObjectId()
      });
      articleId = String(article._id);
    });

    it('should create article embedding', async () => {
      const embedding = new ArticleEmbedding({
        articleId: new mongoose.Types.ObjectId(articleId),
        content: 'How to Process Refunds - Step 1: Check the order status...',
        embedding: new Array(384).fill(0.1),
        embeddingModel: 'test-model',
        lastUpdated: new Date()
      });

      const saved = await embedding.save();
      expect(saved._id).toBeDefined();
      expect(saved.embedding).toHaveLength(384);
    });

    it('should calculate cosine similarity between embeddings', async () => {
      const embedding1 = new Array(384).fill(0.5);
      const embedding2 = new Array(384).fill(0.3);

      const articleEmbedding = new ArticleEmbedding({
        articleId: new mongoose.Types.ObjectId(articleId),
        content: 'Test content',
        embedding: embedding1,
        embeddingModel: 'test-model',
        lastUpdated: new Date()
      });

      const similarity = articleEmbedding.cosineSimilarity(embedding2);
      expect(typeof similarity).toBe('number');
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThanOrEqual(1);
    });
  });

  describe('RAG Service', () => {
    beforeEach(async () => {
      // Create test articles
      const articles = await Article.create([
        {
          title: 'Billing Refund Process',
          body: 'To process a refund: 1. Verify the transaction 2. Check refund policy 3. Submit refund request 4. Confirm processing',
          tags: ['billing', 'refund'],
          status: 'published',
          createdBy: new mongoose.Types.ObjectId()
        },
        {
          title: 'Technical Support Guide',
          body: 'For technical issues: 1. Clear browser cache 2. Restart the application 3. Check internet connection 4. Contact support if needed',
          tags: ['technical', 'support'],
          status: 'published',
          createdBy: new mongoose.Types.ObjectId()
        },
        {
          title: 'Shipping Information',
          body: 'Shipping details: 1. Processing time is 1-2 days 2. Standard shipping takes 3-5 days 3. Track your package online',
          tags: ['shipping', 'delivery'],
          status: 'published',
          createdBy: new mongoose.Types.ObjectId()
        }
      ]);

      // Generate embeddings for test articles
      for (const article of articles) {
        await RAGService.generateEmbeddingForArticle(String(article._id));
      }
    });

    it('should retrieve relevant content using vector search', async () => {
      const result = await RAGService.retrieveRelevantContent(
        'I need help with a billing refund',
        3,
        true
      );

      expect(result.articles).toBeDefined();
      expect(result.query).toBe('I need help with a billing refund');
      expect(result.searchMethod).toMatch(/vector|hybrid|keyword/);
      expect(result.totalMatches).toBeGreaterThanOrEqual(0);
      expect(result.executionTimeMs).toBeGreaterThan(0);
    });

    it('should fall back to keyword search when vector search fails', async () => {
      const result = await RAGService.retrieveRelevantContent(
        'technical support needed',
        3,
        false // Disable vector search
      );

      expect(result.searchMethod).toBe('keyword');
      expect(result.articles).toBeDefined();
    });

    it('should build context from retrieved articles', async () => {
      const ragResult = await RAGService.retrieveRelevantContent(
        'shipping question',
        2,
        true
      );

      const context = RAGService.buildContext(ragResult.articles, 'shipping question');

      expect(context.articles).toBeDefined();
      expect(context.searchQuery).toBe('shipping question');
      expect(context.totalTokens).toBeGreaterThan(0);
      expect(context.maxContextLength).toBe(8000);
      expect(context.relevanceScores).toHaveLength(context.articles.length);
    });

    it('should generate embedding for article', async () => {
      const article = await Article.create({
        title: 'Test Article for Embedding',
        body: 'This is a test article content for embedding generation.',
        tags: ['test'],
        status: 'published',
        createdBy: new mongoose.Types.ObjectId()
      });

      await RAGService.generateEmbeddingForArticle(String(article._id));

      const embedding = await ArticleEmbedding.findOne({ articleId: article._id });
      expect(embedding).toBeDefined();
      expect(embedding!.embedding).toHaveLength(384);
      expect(embedding!.embeddingModel).toBe('local-embeddings-v1');
    });

    it('should get embedding statistics', async () => {
      const stats = await RAGService.getEmbeddingStats();

      expect(stats).toHaveProperty('totalArticles');
      expect(stats).toHaveProperty('articlesWithEmbeddings');
      expect(stats).toHaveProperty('embeddingsNeedingUpdate');
      expect(stats).toHaveProperty('averageEmbeddingAge');
      expect(typeof stats.totalArticles).toBe('number');
      expect(typeof stats.articlesWithEmbeddings).toBe('number');
    });
  });

  describe('RAG API Endpoints', () => {
    beforeEach(async () => {
      // Create test articles
      await Article.create([
        {
          title: 'Payment Issues Resolution',
          body: 'Follow these steps to resolve payment issues: 1. Check payment method 2. Verify billing information 3. Try alternative payment',
          tags: ['payment', 'billing'],
          status: 'published',
          createdBy: new mongoose.Types.ObjectId()
        }
      ]);
    });

    it('should search using RAG endpoint', async () => {
      const response = await request(app)
        .post('/api/rag/search')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          query: 'payment problem',
          limit: 3,
          useVectorSearch: true
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.result).toHaveProperty('articles');
      expect(response.body.result).toHaveProperty('searchMethod');
      expect(response.body.result).toHaveProperty('executionTimeMs');
      expect(response.body.result).toHaveProperty('atlasMetadata');
    });

    it('should require authentication for RAG search', async () => {
      const response = await request(app)
        .post('/api/rag/search')
        .send({
          query: 'test query',
          limit: 3
        });

      expect(response.status).toBe(401);
    });

    it('should get RAG statistics (admin only)', async () => {
      const response = await request(app)
        .get('/api/rag/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.stats).toHaveProperty('totalArticles');
      expect(response.body.stats).toHaveProperty('articlesWithEmbeddings');
      expect(response.body.stats).toHaveProperty('coveragePercentage');
    });

    it('should deny RAG statistics to non-admin users', async () => {
      const response = await request(app)
        .get('/api/rag/stats')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });

    it('should generate embedding for specific article (admin/agent)', async () => {
      const article = await Article.create({
        title: 'Test Article',
        body: 'Test content for embedding generation',
        tags: ['test'],
        status: 'published',
        createdBy: new mongoose.Types.ObjectId()
      });

      const response = await request(app)
        .post(`/api/rag/embeddings/generate/${article._id}`)
        .set('Authorization', `Bearer ${agentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Embedding generated');
    });

    it('should start batch embedding generation (admin only)', async () => {
      const response = await request(app)
        .post('/api/rag/embeddings/generate-all')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('background');
    });

    it('should test context building', async () => {
      const response = await request(app)
        .post('/api/rag/test/context')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          query: 'billing issue',
          limit: 2
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.context).toHaveProperty('searchQuery');
      expect(response.body.context).toHaveProperty('selectedArticles');
      expect(response.body.context).toHaveProperty('totalTokens');
      expect(response.body.searchInfo).toHaveProperty('method');
    });

    it('should validate search query parameters', async () => {
      const response = await request(app)
        .post('/api/rag/search')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          query: '', // Invalid empty query
          limit: 3
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle invalid article ID for embedding generation', async () => {
      const response = await request(app)
        .post('/api/rag/embeddings/generate/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should delete embedding for article (admin only)', async () => {
      const article = await Article.create({
        title: 'Test Article',
        body: 'Test content',
        tags: ['test'],
        status: 'published',
        createdBy: new mongoose.Types.ObjectId()
      });

      // First generate an embedding
      await RAGService.generateEmbeddingForArticle(String(article._id));

      // Then delete it
      const response = await request(app)
        .delete(`/api/rag/embeddings/${article._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify embedding was deleted
      const embedding = await ArticleEmbedding.findOne({ articleId: article._id });
      expect(embedding).toBeNull();
    });
  });

  describe('Enhanced Knowledge Base Integration', () => {
    it('should automatically generate embeddings when article is published', async () => {
      const response = await request(app)
        .post('/api/kb/articles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Auto Embedding Test',
          body: 'This article should automatically generate embeddings when published.',
          tags: ['auto', 'test'],
          status: 'published'
        });

      expect(response.status).toBe(201);
      const articleId = response.body.article._id;

      // Wait a moment for async embedding generation
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if embedding was created
      const embedding = await ArticleEmbedding.findOne({ articleId });
      expect(embedding).toBeDefined();
    });

    it('should use RAG for enhanced article retrieval', async () => {
      // Create articles
      await Article.create([
        {
          title: 'Customer Service Best Practices',
          body: 'Provide excellent customer service by being responsive, helpful, and professional.',
          tags: ['service', 'customer'],
          status: 'published',
          createdBy: new mongoose.Types.ObjectId()
        }
      ]);

      const response = await request(app)
        .get('/api/kb/articles?search=customer service')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.articles).toBeDefined();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty search queries gracefully', async () => {
      const result = await RAGService.retrieveRelevantContent('', 3, true);

      expect(result.articles).toHaveLength(0);
      expect(result.totalMatches).toBe(0);
      expect(result.searchMethod).toBe('keyword');
    });

    it('should handle non-existent article embedding requests', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      await expect(
        RAGService.generateEmbeddingForArticle(String(fakeId))
      ).rejects.toThrow('Article not found');
    });

    it('should handle malformed embedding data', async () => {
      const embedding1 = [1, 2, 3];
      const embedding2 = [1, 2]; // Different length

      expect(() => {
        VectorEmbeddingService.cosineSimilarity(embedding1, embedding2);
      }).toThrow('Embeddings must have the same dimensions');
    });

    it('should handle very large articles with chunking', async () => {
      const largeContent = 'This is a very long article. '.repeat(200); // ~6000 characters
      
      const article = await Article.create({
        title: 'Large Article Test',
        body: largeContent,
        tags: ['large', 'test'],
        status: 'published',
        createdBy: new mongoose.Types.ObjectId()
      });

      await RAGService.generateEmbeddingForArticle(String(article._id));

      const embedding = await ArticleEmbedding.findOne({ articleId: article._id });
      expect(embedding).toBeDefined();
      expect(embedding!.chunks).toBeDefined();
      expect(embedding!.chunks!.length).toBeGreaterThan(0);
    });
  });

  describe('Atlas Vector Search Configuration', () => {
    it('should load Atlas configuration correctly', () => {
      const config = getAtlasConfig();
      
      expect(config).toHaveProperty('enabled');
      expect(config).toHaveProperty('indexName');
      expect(config).toHaveProperty('vectorDimension', 384);
      expect(config).toHaveProperty('similarity');
      expect(config).toHaveProperty('candidates');
      expect(config).toHaveProperty('scoreThreshold');
      expect(config.hybridWeightVector + config.hybridWeightText).toBe(1);
    });

    it('should validate Atlas configuration', async () => {
      const { validateAtlasIndexConfiguration } = await import('../config/atlas.js');
      const validation = validateAtlasIndexConfiguration();
      
      expect(validation).toHaveProperty('valid');
      expect(validation).toHaveProperty('config');
      expect(validation).toHaveProperty('recommendations');
      
      if (!validation.valid) {
        console.warn('Atlas configuration issues:', validation.issues);
        console.warn('Recommendations:', validation.recommendations);
      }
    });
  });

  describe('Atlas RAG Service', () => {
    beforeEach(async () => {
      // Create test articles for Atlas testing
      const articles = await Article.create([
        {
          title: 'Atlas Vector Search Guide',
          body: 'MongoDB Atlas Vector Search enables semantic search using vector embeddings for better relevance.',
          tags: ['atlas', 'vector', 'search'],
          status: 'published',
          createdBy: new mongoose.Types.ObjectId()
        },
        {
          title: 'Hybrid Search Implementation',
          body: 'Combine vector similarity with text search for comprehensive results and improved accuracy.',
          tags: ['hybrid', 'search', 'implementation'],
          status: 'published',
          createdBy: new mongoose.Types.ObjectId()
        }
      ]);

      // Generate Atlas-optimized embeddings
      for (const article of articles) {
        await AtlasRAGService.generateEmbeddingForArticle(String(article._id));
      }
    });

    it('should check Atlas availability', async () => {
      const isAvailable = await AtlasRAGService.isAtlasAvailable();
      expect(typeof isAvailable).toBe('boolean');
      
      // Note: In test environment, Atlas may not be available, which is expected
      console.log('Atlas Vector Search available:', isAvailable);
    });

    it('should get Atlas statistics', async () => {
      const stats = await AtlasRAGService.getAtlasStats();
      
      expect(stats).toHaveProperty('totalEmbeddings');
      expect(stats).toHaveProperty('vectorSearchEnabled');
      expect(stats).toHaveProperty('properlyIndexed');
      expect(stats).toHaveProperty('atlasVectorSearchAvailable');
      expect(stats).toHaveProperty('isHealthy');
      expect(stats).toHaveProperty('readinessScore');
      expect(typeof stats.readinessScore).toBe('number');
      expect(stats.readinessScore).toBeGreaterThanOrEqual(0);
      expect(stats.readinessScore).toBeLessThanOrEqual(1);
    });

    it('should retrieve relevant content with Atlas integration', async () => {
      const result = await AtlasRAGService.retrieveRelevantContent(
        'vector search implementation',
        3,
        true,
        false // Don't force Atlas in test environment
      );
      
      expect(result).toHaveProperty('articles');
      expect(result).toHaveProperty('query', 'vector search implementation');
      expect(result).toHaveProperty('searchMethod');
      expect(result).toHaveProperty('totalMatches');
      expect(result).toHaveProperty('executionTimeMs');
      expect(result).toHaveProperty('atlasMetadata');
      expect(result.atlasMetadata).toHaveProperty('atlasEnabled');
      
      // Verify articles structure
      result.articles.forEach(item => {
        expect(item).toHaveProperty('article');
        expect(item).toHaveProperty('score');
        expect(item).toHaveProperty('relevanceReason');
        expect(item).toHaveProperty('searchMethod');
        expect(typeof item.score).toBe('number');
      });
    });

    it('should build context with Atlas metadata', async () => {
      const ragResult = await AtlasRAGService.retrieveRelevantContent(
        'hybrid search methods',
        2,
        true
      );
      
      const context = AtlasRAGService.buildContext(ragResult.articles, 'hybrid search methods');
      
      expect(context).toHaveProperty('searchQuery', 'hybrid search methods');
      expect(context).toHaveProperty('articles');
      expect(context).toHaveProperty('totalTokens');
      expect(context).toHaveProperty('maxContextLength', 8000);
      expect(context).toHaveProperty('relevanceScores');
      expect(context).toHaveProperty('searchMetadata');
      expect(context.searchMetadata).toHaveProperty('method');
      expect(context.searchMetadata).toHaveProperty('executionTime');
      expect(context.searchMetadata).toHaveProperty('atlasEnabled');
    });

    it('should generate Atlas-optimized embeddings', async () => {
      const article = await Article.create({
        title: 'Atlas Embedding Test',
        body: 'This article tests Atlas-optimized embedding generation with exact 384 dimensions.',
        tags: ['atlas', 'embedding', 'test'],
        status: 'published',
        createdBy: new mongoose.Types.ObjectId()
      });
      
      await AtlasRAGService.generateEmbeddingForArticle(String(article._id));
      
      const embedding = await ArticleEmbedding.findOne({ articleId: article._id });
      expect(embedding).toBeDefined();
      expect(embedding!.embedding).toHaveLength(384);
      expect(embedding!.vectorSearchEnabled).toBe(true);
      expect(embedding!.indexVersion).toBe('atlas-v1');
    });

    it('should handle fallback gracefully when Atlas is unavailable', async () => {
      // This test ensures the system works even when Atlas is not configured
      const result = await AtlasRAGService.retrieveRelevantContent(
        'fallback test query',
        3,
        true,
        false // Don't force Atlas
      );
      
      expect(result).toHaveProperty('articles');
      expect(result).toHaveProperty('searchMethod');
      
      // Should either use Atlas or fall back to legacy
      expect(['atlas-vector', 'atlas-hybrid', 'atlas-text', 'fallback']).toContain(result.searchMethod);
      
      if (result.searchMethod === 'fallback') {
        expect(result.atlasMetadata).toHaveProperty('fallbackReason');
      }
    });
  });

  describe('Enhanced RAG API Endpoints with Atlas', () => {
    it('should support Atlas health check endpoint (admin only)', async () => {
      const response = await request(app)
        .get('/api/rag/atlas/health')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.atlas).toHaveProperty('available');
      expect(response.body.atlas).toHaveProperty('healthy');
      expect(response.body.atlas).toHaveProperty('readinessScore');
      expect(response.body.atlas).toHaveProperty('stats');
      expect(response.body.atlas).toHaveProperty('recommendations');
      expect(Array.isArray(response.body.atlas.recommendations)).toBe(true);
    });

    it('should support forced Atlas search endpoint (admin only)', async () => {
      const response = await request(app)
        .post('/api/rag/atlas/search')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          query: 'atlas vector search',
          limit: 3
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.result).toHaveProperty('searchMethod');
      expect(response.body.result).toHaveProperty('atlasMetadata');
      expect(response.body.result).toHaveProperty('performanceGain');
      expect(response.body).toHaveProperty('note');
      expect(response.body.note).toContain('testing purposes');
    });

    it('should support search method comparison endpoint (admin only)', async () => {
      const response = await request(app)
        .post('/api/rag/compare')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          query: 'comparison test query',
          limit: 3
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.comparison).toHaveProperty('query', 'comparison test query');
      expect(response.body.comparison).toHaveProperty('atlas');
      expect(response.body.comparison).toHaveProperty('legacy');
      
      // Both atlas and legacy should have success status
      expect(response.body.comparison.atlas).toHaveProperty('success');
      expect(response.body.comparison.legacy).toHaveProperty('success');
      
      // If both successful, should have performance analysis
      if (response.body.comparison.atlas.success && response.body.comparison.legacy.success) {
        expect(response.body.comparison).toHaveProperty('performanceAnalysis');
      }
    });

    it('should include Atlas metadata in regular search results', async () => {
      const response = await request(app)
        .post('/api/rag/search')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          query: 'atlas metadata test',
          limit: 3,
          useVectorSearch: true,
          forceAtlas: false // Test parameter addition
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.result).toHaveProperty('atlasMetadata');
      expect(response.body.result.atlasMetadata).toHaveProperty('atlasEnabled');
    });

    it('should include Atlas stats in statistics endpoint', async () => {
      const response = await request(app)
        .get('/api/rag/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.stats).toHaveProperty('atlasStats');
      
      // Atlas stats might be undefined if not available, which is OK
      if (response.body.stats.atlasStats) {
        expect(response.body.stats.atlasStats).toHaveProperty('atlasVectorSearchAvailable');
        expect(response.body.stats.atlasStats).toHaveProperty('isHealthy');
        expect(response.body.stats.atlasStats).toHaveProperty('readinessScore');
      }
    });

    it('should deny Atlas admin endpoints to non-admin users', async () => {
      const endpoints = [
        { method: 'get', path: '/api/rag/atlas/health' },
        { method: 'post', path: '/api/rag/atlas/search', body: { query: 'test', limit: 3 } },
        { method: 'post', path: '/api/rag/compare', body: { query: 'test', limit: 3 } }
      ];
      
      for (const endpoint of endpoints) {
        const requestBuilder = request(app)[endpoint.method as 'get' | 'post'](endpoint.path)
          .set('Authorization', `Bearer ${userToken}`);
        
        if (endpoint.body) {
          requestBuilder.send(endpoint.body);
        }
        
        const response = await requestBuilder;
        expect(response.status).toBe(403);
      }
    });
  });
});