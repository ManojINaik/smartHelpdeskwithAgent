# MongoDB Atlas Vector Search Setup Guide

This guide will help you set up MongoDB Atlas Vector Search for the Smart Helpdesk RAG (Retrieval-Augmented Generation) system.

## Prerequisites

- MongoDB Atlas cluster (M10 or higher for Vector Search)
- Node.js application with the smart-helpdesk codebase
- Admin access to MongoDB Atlas cluster

## Table of Contents

1. [Atlas Cluster Setup](#atlas-cluster-setup)
2. [Vector Search Index Configuration](#vector-search-index-configuration)
3. [Environment Configuration](#environment-configuration)
4. [Database Migration](#database-migration)
5. [Testing Vector Search](#testing-vector-search)
6. [Performance Optimization](#performance-optimization)
7. [Troubleshooting](#troubleshooting)

## Atlas Cluster Setup

### 1. Create or Configure Atlas Cluster

```bash
# Minimum requirements for Vector Search:
- Cluster tier: M10 or higher
- MongoDB version: 6.0.11, 7.0.2, or later
- Region: Any (recommend same region as your application)
```

### 2. Enable Atlas Vector Search

1. Navigate to your Atlas cluster
2. Go to "Search" tab
3. Ensure Vector Search is available (included in M10+ clusters)

## Vector Search Index Configuration

### 1. Create Vector Search Index

Navigate to Atlas Console → Database Deployments → Your Cluster → Search → Create Index

**Index Configuration:**
```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 384,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "vectorSearchEnabled"
    },
    {
      "type": "filter", 
      "path": "articleId"
    }
  ]
}
```

**Index Details:**
- **Index Name:** `vector_index` (default, configurable via `ATLAS_SEARCH_INDEX_NAME`)
- **Database:** Your smart-helpdesk database
- **Collection:** `articleembeddings`

### 2. Create Text Search Index (for Hybrid Search)

Create a second index for text search capabilities:

```json
{
  "mappings": {
    "fields": {
      "content": {
        "type": "string",
        "analyzer": "lucene.standard"
      },
      "articleId": {
        "type": "objectId"
      }
    }
  }
}
```

**Text Index Details:**
- **Index Name:** `vector_index_text` 
- **Database:** Your smart-helpdesk database
- **Collection:** `articleembeddings`

## Environment Configuration

### 1. Update Environment Variables

Add to your `.env` file:

```bash
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority

# Atlas Vector Search Configuration
ATLAS_VECTOR_SEARCH_ENABLED=true
ATLAS_SEARCH_INDEX_NAME=vector_index
ATLAS_VECTOR_DIMENSION=384
ATLAS_VECTOR_SIMILARITY=cosine
ATLAS_VECTOR_CANDIDATES=100
ATLAS_SEARCH_SCORE_THRESHOLD=0.3
```

### 2. Configuration Options

| Variable | Description | Default | Options |
|----------|-------------|---------|---------|
| `ATLAS_VECTOR_SEARCH_ENABLED` | Enable/disable Atlas Vector Search | `false` | `true`, `false` |
| `ATLAS_SEARCH_INDEX_NAME` | Vector search index name | `vector_index` | Any valid index name |
| `ATLAS_VECTOR_DIMENSION` | Embedding dimensions | `384` | Must match your embedding model |
| `ATLAS_VECTOR_SIMILARITY` | Similarity function | `cosine` | `cosine`, `euclidean`, `dotProduct` |
| `ATLAS_VECTOR_CANDIDATES` | Candidates for search | `100` | 10-10000 |
| `ATLAS_SEARCH_SCORE_THRESHOLD` | Minimum similarity score | `0.3` | 0.0-1.0 |

## Database Migration

### 1. Generate Embeddings for Existing Articles

```bash
# Using the API (admin authentication required)
curl -X POST "http://localhost:3000/api/rag/embeddings/generate-all" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json"

# Check progress in server logs
docker-compose logs -f api
```

### 2. Verify Embedding Generation

```bash
# Check RAG statistics
curl -X GET "http://localhost:3000/api/rag/stats" \
  -H "Authorization: Bearer <admin-token>"
```

Expected response structure:
```json
{
  "success": true,
  "stats": {
    "totalArticles": 50,
    "articlesWithEmbeddings": 50,
    "embeddingsNeedingUpdate": 0,
    "coveragePercentage": 100,
    "atlasStats": {
      "atlasVectorSearchAvailable": true,
      "isHealthy": true,
      "readinessScore": 1.0
    }
  }
}
```

## Testing Vector Search

### 1. Atlas Health Check

```bash
# Check Atlas availability
curl -X GET "http://localhost:3000/api/rag/atlas/health" \
  -H "Authorization: Bearer <admin-token>"
```

Expected response:
```json
{
  "success": true,
  "atlas": {
    "available": true,
    "healthy": true,
    "readinessScore": 1.0,
    "stats": {
      "totalEmbeddings": 50,
      "vectorSearchEnabled": 50,
      "properlyIndexed": 50
    },
    "recommendations": ["Atlas Vector Search is operational"]
  }
}
```

### 2. Test Vector Search

```bash
# Test Atlas vector search
curl -X POST "http://localhost:3000/api/rag/atlas/search" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "billing refund process",
    "limit": 5
  }'
```

### 3. Performance Comparison

```bash
# Compare Atlas vs Legacy search
curl -X POST "http://localhost:3000/api/rag/compare" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "technical support issue",
    "limit": 5
  }'
```

## Performance Optimization

### 1. Index Optimization

**Vector Search Index Settings:**
```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding", 
      "numDimensions": 384,
      "similarity": "cosine"
    }
  ]
}
```

**Recommended Settings:**
- **Similarity Function:** Use `cosine` for normalized embeddings
- **Candidates:** Start with 100, increase for better recall
- **Filters:** Add filters for `vectorSearchEnabled` and `articleId`

### 2. Application-Level Optimization

**Caching Strategy:**
```typescript
// Atlas availability is cached for 5 minutes
// Embedding generation includes dimension validation
// Hybrid search combines vector (70%) + text (30%) scoring
```

**Performance Monitoring:**
```bash
# Monitor search performance
curl -X POST "http://localhost:3000/api/rag/search" \
  -H "Authorization: Bearer <token>" \
  -d '{"query": "test", "useVectorSearch": true}' | \
  jq '.result.executionTimeMs'
```

### 3. Scaling Considerations

| Metric | Recommendation |
|---------|----------------|
| **Articles** | Up to 1M articles per collection |
| **Embedding Dimensions** | 384 (optimal for performance/quality) |
| **Index Size** | Monitor Atlas metrics, upgrade cluster if needed |
| **Query Latency** | Target <100ms for vector search |
| **Batch Size** | Generate embeddings in batches of 50-100 |

## Troubleshooting

### Common Issues

#### 1. "Atlas Vector Search not available"

**Symptoms:** 
- `atlasVectorSearchAvailable: false` in health check
- Fallback to legacy search always occurs

**Solutions:**
```bash
# Check cluster tier
# Vector Search requires M10+ cluster

# Verify index exists
# Check Atlas Console → Search → Indexes

# Test index configuration
curl -X GET "http://localhost:3000/api/rag/atlas/health" \
  -H "Authorization: Bearer <admin-token>"
```

#### 2. "Embedding dimension mismatch"

**Symptoms:**
- Error: "Embedding must be exactly 384 dimensions"
- `properlyIndexed: 0` in statistics

**Solutions:**
```bash
# Check embedding dimensions in database
mongo "mongodb+srv://cluster.mongodb.net/database" --eval "
  db.articleembeddings.findOne({}, {embedding: {$slice: 5}})
"

# Regenerate embeddings if needed  
curl -X POST "http://localhost:3000/api/rag/embeddings/generate-all" \
  -H "Authorization: Bearer <admin-token>"
```

#### 3. "Poor search results"

**Symptoms:**
- Low similarity scores
- Irrelevant results returned

**Solutions:**
```bash
# Lower score threshold
ATLAS_SEARCH_SCORE_THRESHOLD=0.1

# Increase candidate count  
ATLAS_VECTOR_CANDIDATES=200

# Test hybrid search
curl -X POST "http://localhost:3000/api/rag/search" \
  -H "Authorization: Bearer <token>" \
  -d '{"query": "test query", "useVectorSearch": true}'
```

### Performance Issues

#### Slow Vector Search (>1000ms)

1. **Check Atlas Cluster Resources**
   - Upgrade to higher cluster tier if CPU/Memory high
   - Monitor Atlas Performance Advisor

2. **Optimize Index Configuration**
   ```json
   {
     "numCandidates": 50,  // Reduce for faster search
     "limit": 10          // Limit result count
   }
   ```

3. **Application-Level Caching**
   ```typescript
   // Implement Redis caching for frequent queries
   // Cache embedding generation results
   ```

### Monitoring and Alerts

#### Key Metrics to Monitor

1. **Atlas Metrics**
   - Vector search query count
   - Average query latency  
   - Index size and memory usage

2. **Application Metrics**
   ```bash
   # Search method distribution
   grep "searchMethod.*atlas" logs/ | wc -l
   
   # Average execution time
   grep "executionTimeMs" logs/ | jq '.executionTimeMs' | avg
   ```

3. **Health Checks**
   ```bash
   # Automated health monitoring
   */5 * * * * curl -s http://localhost:3000/api/rag/atlas/health \
     -H "Authorization: Bearer <token>" | \
     jq '.atlas.healthy' || alert "Atlas Vector Search unhealthy"
   ```

## Migration from Legacy to Atlas

### Step-by-Step Migration

1. **Phase 1: Setup (No Downtime)**
   - Configure Atlas Vector Search index
   - Enable Atlas in environment (`ATLAS_VECTOR_SEARCH_ENABLED=true`)
   - System automatically falls back to legacy search

2. **Phase 2: Generate Embeddings**
   ```bash
   # Generate embeddings for all articles
   curl -X POST "http://localhost:3000/api/rag/embeddings/generate-all" \
     -H "Authorization: Bearer <admin-token>"
   ```

3. **Phase 3: Verify and Test**
   ```bash
   # Check health and performance
   curl -X POST "http://localhost:3000/api/rag/compare" \
     -H "Authorization: Bearer <admin-token>" \
     -d '{"query": "sample query", "limit": 5}'
   ```

4. **Phase 4: Monitor**
   - Monitor search performance and accuracy
   - Adjust configuration based on usage patterns

### Rollback Plan

If issues occur, Atlas Vector Search can be disabled instantly:

```bash
# Disable Atlas Vector Search
ATLAS_VECTOR_SEARCH_ENABLED=false

# Or via API (requires restart)  
curl -X POST "http://localhost:3000/api/config/update" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{"ATLAS_VECTOR_SEARCH_ENABLED": false}'
```

System will automatically fall back to legacy vector search with no data loss.

## Conclusion

MongoDB Atlas Vector Search provides significant performance improvements for the Smart Helpdesk RAG system:

- **Performance:** Sub-100ms semantic search vs 500-1000ms legacy search
- **Accuracy:** Better semantic understanding with hybrid search
- **Scalability:** Handles millions of embeddings efficiently
- **Reliability:** Automatic fallback ensures zero downtime

For production deployment, ensure proper monitoring, regular health checks, and performance optimization based on usage patterns.

## Additional Resources

- [MongoDB Atlas Vector Search Documentation](https://docs.atlas.mongodb.com/atlas-vector-search/)
- [Smart Helpdesk RAG API Documentation](./RAG_API.md)
- [Embedding Generation Guide](./EMBEDDINGS.md)
- [Performance Tuning Guide](./PERFORMANCE.md)