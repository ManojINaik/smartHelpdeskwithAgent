import { Schema, model, Document, Model } from 'mongoose';
import { BaseDocument } from '../types/models.js';
import { getAtlasConfig } from '../config/atlas.js';

export interface IArticleEmbedding extends BaseDocument {
  articleId: Schema.Types.ObjectId;
  content: string; // Combined title + body for embedding
  embedding: number[]; // 384-dimensional vector for Atlas Vector Search
  embeddingModel: string; // Model used for embedding
  chunks?: {
    text: string;
    embedding: number[];
    startIndex: number;
    endIndex: number;
  }[]; // For large articles, store text chunks separately
  lastUpdated: Date;
  // Atlas Vector Search metadata
  vectorSearchEnabled?: boolean;
  indexVersion?: string;
}

// Extend the model interface to include static methods
export interface IArticleEmbeddingModel extends Model<IArticleEmbedding> {
  findSimilar(queryEmbedding: number[], limit?: number, threshold?: number): Promise<Array<{
    embedding: any;
    similarity: number;
    article: any;
  }>>;
  vectorSearch(queryEmbedding: number[], limit?: number, threshold?: number): Promise<Array<{
    embedding: any;
    similarity: number;
    article: any;
  }>>;
  hybridSearch(queryEmbedding: number[], textQuery: string, limit?: number, vectorWeight?: number): Promise<Array<{
    embedding: any;
    similarity: number;
    vectorScore?: number;
    textScore?: number;
    article: any;
  }>>;
  isAtlasVectorSearchAvailable(): Promise<boolean>;
  getVectorSearchStats(): Promise<{
    totalEmbeddings: number;
    vectorSearchEnabled: number;
    properlyIndexed: number;
    atlasVectorSearchAvailable: boolean;
    isHealthy: boolean;
    readinessScore: number;
    config: {
      enabled: boolean;
      indexName: string;
      vectorDimension: number;
      similarity: string;
    };
  }>;
}

const articleEmbeddingSchema = new Schema<IArticleEmbedding>({
  articleId: {
    type: Schema.Types.ObjectId,
    ref: 'Article',
    required: true,
    unique: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 100000 // Limit content size for embedding
  },
  embedding: {
    type: [Number],
    required: true,
    validate: {
      validator: function(arr: number[]) {
        // Atlas Vector Search requires exact dimension match
        return Array.isArray(arr) && arr.length === 384;
      },
      message: 'Embedding must be exactly 384 dimensions for Atlas Vector Search compatibility'
    },
    // Optimize for vector search performance
    index: false // Will use Atlas Vector Search index instead
  },
  embeddingModel: {
    type: String,
    required: true,
    default: 'local-embeddings-v1'
  },
  chunks: [{
    text: String,
    embedding: {
      type: [Number],
      validate: {
        validator: function(arr: number[]) {
          return !arr || arr.length === 384;
        },
        message: 'Chunk embedding must be exactly 384 dimensions'
      }
    },
    startIndex: Number,
    endIndex: Number
  }],
  lastUpdated: {
    type: Date,
    default: Date.now,
    required: true
  },
  // Atlas Vector Search metadata
  vectorSearchEnabled: {
    type: Boolean,
    default: true
  },
  indexVersion: {
    type: String,
    default: 'v1'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for Atlas Vector Search and traditional search
articleEmbeddingSchema.index({ articleId: 1 });
articleEmbeddingSchema.index({ embeddingModel: 1 });
articleEmbeddingSchema.index({ lastUpdated: -1 });
articleEmbeddingSchema.index({ vectorSearchEnabled: 1 });
// Text index for hybrid search
articleEmbeddingSchema.index({ content: 'text' });

// Instance method to calculate cosine similarity with another embedding
articleEmbeddingSchema.methods.cosineSimilarity = function(otherEmbedding: number[]): number {
  if (!this.embedding || !otherEmbedding || this.embedding.length !== otherEmbedding.length) {
    return 0;
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < this.embedding.length; i++) {
    const embeddingValue = this.embedding[i];
    const otherEmbeddingValue = otherEmbedding[i];
    
    if (embeddingValue !== undefined && otherEmbeddingValue !== undefined) {
      dotProduct += embeddingValue * otherEmbeddingValue;
      normA += embeddingValue * embeddingValue;
      normB += otherEmbeddingValue * otherEmbeddingValue;
    }
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

// Method to find similar embeddings using cosine similarity
articleEmbeddingSchema.statics.findSimilar = async function(
  queryEmbedding: number[],
  limit: number = 5,
  threshold: number = 0.1
) {
  const embeddings = await this.find().populate('articleId');
  const similarities: Array<{
    embedding: any;
    similarity: number;
    article: any;
  }> = [];

  for (const embedding of embeddings) {
    if (embedding.articleId && embedding.articleId.status === 'published') {
      const similarity = embedding.cosineSimilarity(queryEmbedding);
      if (similarity >= threshold) {
        similarities.push({
          embedding,
          similarity,
          article: embedding.articleId
        });
      }
    }
  }

  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
};

// Static method for Atlas Vector Search
articleEmbeddingSchema.statics.vectorSearch = async function(
  queryEmbedding: number[], 
  limit: number = 5,
  threshold: number = 0.1
) {
  if (!queryEmbedding || queryEmbedding.length !== 384) {
    throw new Error('Query embedding must be exactly 384 dimensions for Atlas Vector Search');
  }

  const atlasConfig = getAtlasConfig();
  
  if (!atlasConfig.enabled) {
    console.warn('Atlas Vector Search is disabled, falling back to similarity search');
    return await (this as IArticleEmbeddingModel).findSimilar(queryEmbedding, limit, threshold);
  }

  try {
    const results = await this.aggregate([
      {
        $vectorSearch: {
          index: atlasConfig.indexName,
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: Math.max(atlasConfig.candidates, limit * 10),
          limit: limit,
          filter: {
            vectorSearchEnabled: { $ne: false }
          }
        }
      },
      {
        $addFields: {
          vectorScore: { $meta: 'vectorSearchScore' }
        }
      },
      {
        $match: {
          vectorScore: { $gte: Math.max(threshold, atlasConfig.scoreThreshold) }
        }
      },
      {
        $lookup: {
          from: 'articles',
          localField: 'articleId',
          foreignField: '_id',
          as: 'article'
        }
      },
      {
        $unwind: '$article'
      },
      {
        $match: {
          'article.status': 'published'
        }
      },
      {
        $project: {
          _id: 1,
          articleId: 1,
          content: 1,
          embedding: 1,
          vectorScore: 1,
          article: {
            _id: 1,
            title: 1,
            body: 1,
            tags: 1,
            status: 1,
            createdAt: 1,
            updatedAt: 1
          }
        }
      }
    ]);

    return results.map((doc: any) => ({
      embedding: doc,
      similarity: doc.vectorScore,
      article: doc.article
    }));
  } catch (error: any) {
    console.warn('Atlas Vector Search failed, falling back to similarity search:', error.message);
    // Fallback to existing similarity search
    return await (this as IArticleEmbeddingModel).findSimilar(queryEmbedding, limit, Math.max(threshold, atlasConfig.scoreThreshold));
  }
};

// Pre-save middleware to update lastUpdated
articleEmbeddingSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Method to check if Atlas Vector Search is available
articleEmbeddingSchema.statics.isAtlasVectorSearchAvailable = async function() {
  const atlasConfig = getAtlasConfig();
  
  if (!atlasConfig.enabled) {
    return false;
  }
  
  try {
    // Test if vector search index exists by attempting a simple query
    await this.aggregate([
      {
        $vectorSearch: {
          index: atlasConfig.indexName,
          path: 'embedding',
          queryVector: new Array(atlasConfig.vectorDimension).fill(0),
          numCandidates: 1,
          limit: 1
        }
      },
      { $limit: 1 }
    ]);
    return true;
  } catch (error) {
    return false;
  }
};

// Method to get vector search statistics
articleEmbeddingSchema.statics.getVectorSearchStats = async function() {
  const atlasConfig = getAtlasConfig();
  
  const [total, vectorEnabled, indexed] = await Promise.all([
    this.countDocuments(),
    this.countDocuments({ vectorSearchEnabled: { $ne: false } }),
    this.countDocuments({ 
      embedding: { $exists: true, $type: 'array' },
      [`embedding.${atlasConfig.vectorDimension - 1}`]: { $exists: true } // Check if last dimension exists
    })
  ]);
  
  const atlasAvailable = await (this as IArticleEmbeddingModel).isAtlasVectorSearchAvailable();
  
  return {
    totalEmbeddings: total,
    vectorSearchEnabled: vectorEnabled,
    properlyIndexed: indexed,
    atlasVectorSearchAvailable: atlasAvailable,
    isHealthy: atlasAvailable && indexed > 0,
    readinessScore: total > 0 ? indexed / total : 0,
    config: {
      enabled: atlasConfig.enabled,
      indexName: atlasConfig.indexName,
      vectorDimension: atlasConfig.vectorDimension,
      similarity: atlasConfig.similarity
    }
  };
};

// Static method for Atlas Hybrid Search (Vector + Text)
articleEmbeddingSchema.statics.hybridSearch = async function(
  queryEmbedding: number[],
  textQuery: string,
  limit: number = 5,
  vectorWeight: number = 0.7
) {
  const atlasConfig = getAtlasConfig();
  
  if (!atlasConfig.enabled) {
    console.warn('Atlas Vector Search is disabled, falling back to legacy hybrid search');
    // Fallback to combining vector and text search results
    const [vectorResults, textResults] = await Promise.all([
      (this as IArticleEmbeddingModel).findSimilar(queryEmbedding, Math.ceil(limit * vectorWeight)),
      this.find(
        { $text: { $search: textQuery } },
        { score: { $meta: 'textScore' } }
      ).populate('articleId').limit(Math.ceil(limit * (1 - vectorWeight))).lean()
    ]);
    
    // Combine and deduplicate
    const combined = new Map();
    vectorResults.forEach((item: any) => {
      combined.set(item.embedding._id.toString(), {
        embedding: item.embedding,
        similarity: item.similarity * vectorWeight,
        article: item.article
      });
    });
    
    textResults.forEach((doc: any) => {
      const id = doc._id.toString();
      const existing = combined.get(id);
      const textScore = (doc as any).score || 0.5;
      
      if (existing) {
        existing.similarity += textScore * (1 - vectorWeight);
      } else {
        combined.set(id, {
          embedding: doc,
          similarity: textScore * (1 - vectorWeight),
          article: doc.articleId
        });
      }
    });
    
    return Array.from(combined.values())
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  try {
    const results = await this.aggregate([
      {
        $vectorSearch: {
          index: atlasConfig.indexName,
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: Math.max(atlasConfig.candidates, limit * 10),
          limit: Math.ceil(limit * 1.5)
        }
      },
      {
        $addFields: {
          vectorScore: { $meta: 'vectorSearchScore' }
        }
      },
      {
        $match: {
          $text: { $search: textQuery }
        }
      },
      {
        $addFields: {
          textScore: { $meta: 'textScore' },
          hybridScore: {
            $add: [
              { $multiply: ['$vectorScore', vectorWeight] },
              { $multiply: [{ $meta: 'textScore' }, 1 - vectorWeight] }
            ]
          }
        }
      },
      {
        $sort: { hybridScore: -1 }
      },
      {
        $limit: limit
      },
      {
        $lookup: {
          from: 'articles',
          localField: 'articleId',
          foreignField: '_id',
          as: 'article'
        }
      },
      {
        $unwind: '$article'
      },
      {
        $match: {
          'article.status': 'published'
        }
      },
      {
        $project: {
          _id: 1,
          articleId: 1,
          content: 1,
          embedding: 1,
          vectorScore: 1,
          textScore: 1,
          hybridScore: 1,
          article: {
            _id: 1,
            title: 1,
            body: 1,
            tags: 1,
            status: 1,
            createdAt: 1,
            updatedAt: 1
          }
        }
      }
    ]);

    return results.map((doc: any) => ({
      embedding: doc,
      similarity: doc.hybridScore,
      vectorScore: doc.vectorScore,
      textScore: doc.textScore,
      article: doc.article
    }));
  } catch (error: any) {
    console.warn('Atlas Hybrid Search failed, falling back to vector search:', error.message);
    return await (this as IArticleEmbeddingModel).vectorSearch(queryEmbedding, limit);
  }
};

const ArticleEmbeddingModel = model<IArticleEmbedding, IArticleEmbeddingModel>('ArticleEmbedding', articleEmbeddingSchema);

export const ArticleEmbedding = ArticleEmbeddingModel;
export default ArticleEmbeddingModel;
