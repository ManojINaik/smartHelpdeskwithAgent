# RAG (Retrieval-Augmented Generation) Implementation

## Overview

This implementation adds powerful vector search and semantic retrieval capabilities to the Smart Helpdesk system, enhancing AI-generated responses with relevant knowledge base content.

## Features

### 🎯 Vector Embeddings
- **Local embedding generation** using TF-IDF-inspired approach with semantic features
- **Automatic embedding generation** when articles are published
- **Text chunking** for large articles (>2000 characters)
- **Embedding management** with update tracking and statistics

### 🔍 Advanced Search Methods
- **Vector Search**: Semantic similarity using cosine similarity
- **Hybrid Search**: Combines vector and keyword search (70% vector, 30% keyword)
- **Keyword Search**: Traditional text search fallback
- **Automatic method selection** based on availability and performance

### 🧠 Enhanced AI Responses
- **RAG-enhanced responses** using relevant knowledge base articles
- **Article-specific action steps** extracted from content
- **Contextual insights** from knowledge base
- **Confidence scoring** based on article relevance

### 📊 Management Interface
- **RAG statistics** dashboard showing coverage and performance
- **Test interface** for trying different queries
- **Bulk embedding generation** for all articles
- **Real-time performance metrics**

## API Endpoints

### Search
```http
POST /api/rag/search
Content-Type: application/json

{
  "query": "I need a refund for my order",
  "limit": 5,
  "useVectorSearch": true
}
```

### Statistics
```http
GET /api/rag/stats
Authorization: Bearer <admin_token>
```

### Generate Embeddings
```http
POST /api/rag/embeddings/generate-all
Authorization: Bearer <admin_token>
```

```http
POST /api/rag/embeddings/generate/:articleId
Authorization: Bearer <admin_token>
```

### Test Context Building
```http
POST /api/rag/test/context
Authorization: Bearer <admin_token>

{
  "query": "shipping problem",
  "limit": 3
}
```

## How It Works

### 1. Article Processing
When articles are published:
1. Content is preprocessed (title + body)
2. Text is chunked if > 2000 characters
3. Vector embeddings are generated
4. Embeddings are stored in `ArticleEmbedding` collection

### 2. Query Processing
When a ticket is created:
1. Query text is processed for semantic features
2. Vector embedding is generated for the query
3. Similar articles are retrieved using cosine similarity
4. Results are ranked and filtered by relevance threshold

### 3. Response Enhancement
The AI system uses retrieved articles to:
1. Extract actionable steps from article content
2. Generate contextual insights
3. Provide relevant resource links
4. Improve confidence scoring

## Vector Embedding Features

### Semantic Categories
The system recognizes domain-specific categories:
- **Billing**: payment, refund, invoice, charge, billing
- **Technical**: error, bug, login, system, connection
- **Shipping**: delivery, tracking, package, carrier
- **Support**: help, assistance, question, issue

### Statistical Features
- Text length normalization
- Word count analysis
- Uppercase/number/punctuation ratios
- Unique word diversity
- Sentence complexity scoring

### Embedding Dimensions
- **384 dimensions** total
- **200 dimensions** for word frequency features
- **100 dimensions** for semantic category features
- **84 dimensions** for statistical features

## Configuration

### Environment Variables
```bash
# Enable/disable specific features
RAG_ENABLED=true
VECTOR_SEARCH_ENABLED=true
AUTO_EMBEDDING_GENERATION=true

# Thresholds
VECTOR_SIMILARITY_THRESHOLD=0.3
RAG_CONFIDENCE_BONUS=0.1
MAX_CONTEXT_LENGTH=8000
```

### Performance Tuning
- **Similarity threshold**: Adjust `vectorSimilarityThreshold` (default: 0.3)
- **Hybrid weights**: Modify `hybridWeightVector` (default: 0.7)
- **Context length**: Set `maxContextLength` (default: 8000 tokens)

## Database Schema

### ArticleEmbedding Collection
```typescript
{
  articleId: ObjectId,
  content: string,
  embedding: number[],
  embeddingModel: string,
  chunks?: Array<{
    text: string,
    embedding: number[],
    startIndex: number,
    endIndex: number
  }>,
  lastUpdated: Date
}
```

## Usage Examples

### Basic Search
```javascript
const result = await api.post('/api/rag/search', {
  query: 'How do I cancel my subscription?',
  limit: 5,
  useVectorSearch: true
});

console.log(result.data.result.articles);
console.log(`Search method: ${result.data.result.searchMethod}`);
console.log(`Execution time: ${result.data.result.executionTimeMs}ms`);
```

### Generate Embeddings
```javascript
// Generate embeddings for all articles
await api.post('/api/rag/embeddings/generate-all');

// Generate embedding for specific article
await api.post('/api/rag/embeddings/generate/60f7b3b3b3b3b3b3b3b3b3b3');
```

### Check System Health
```javascript
const stats = await api.get('/api/rag/stats');
console.log(`Coverage: ${stats.data.stats.coveragePercentage}%`);
console.log(`Up to date: ${stats.data.stats.upToDatePercentage}%`);
```

## Performance Considerations

### Scalability
- **Local embeddings**: Fast generation but limited semantic understanding
- **Production recommendation**: Replace with OpenAI embeddings or Sentence Transformers
- **Vector database**: Consider Pinecone, Weaviate, or Qdrant for production scale

### Memory Usage
- **In-memory similarity**: Current implementation loads all embeddings
- **Optimization**: Implement approximate nearest neighbor search
- **Chunking**: Large articles are automatically chunked to prevent memory issues

### Monitoring
- Track embedding generation time
- Monitor search performance and accuracy
- Watch memory usage during similarity calculations

## Future Enhancements

### 1. External Embedding Services
- OpenAI text-embedding-3-small
- Sentence Transformers models
- Multi-lingual embedding support

### 2. Vector Databases
- Pinecone integration for production scale
- Weaviate for open-source alternative
- Qdrant for self-hosted solution

### 3. Advanced Features
- Re-ranking with cross-encoders
- Query expansion and reformulation
- Feedback learning from user interactions
- A/B testing for different embedding strategies

## Troubleshooting

### Common Issues

**No embeddings found**
- Check if articles are published
- Verify embedding generation completed
- Review similarity threshold settings

**Poor search results**
- Adjust similarity threshold
- Try hybrid search mode
- Review article content quality

**Slow performance**
- Monitor embedding generation queue
- Consider limiting context length
- Implement caching for frequent queries

### Debugging
```javascript
// Enable debug logging
console.log('🔍 RAG Search Debug:', {
  query: 'user query',
  method: 'vector|hybrid|keyword',
  matches: 5,
  executionTime: '150ms'
});

// Check embedding stats
const stats = await api.get('/api/rag/stats');
console.log('📊 RAG Stats:', stats.data.stats);
```

## Integration with Existing System

The RAG system integrates seamlessly with:
- **Knowledge Base Service**: Automatic embedding generation
- **Workflow Orchestrator**: Enhanced article retrieval
- **Stub LLM Provider**: Improved response generation
- **Admin Dashboard**: Management interface
- **Audit System**: Search and generation logging