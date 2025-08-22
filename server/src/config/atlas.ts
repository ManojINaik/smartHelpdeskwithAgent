import { getEnvConfig } from './env.js';

export interface AtlasVectorSearchConfig {
  enabled: boolean;
  indexName: string;
  vectorDimension: number;
  similarity: 'cosine' | 'euclidean' | 'dotProduct';
  candidates: number;
  scoreThreshold: number;
  hybridWeightVector: number;
  hybridWeightText: number;
}

export interface AtlasSearchPipeline {
  vectorSearch?: {
    index: string;
    path: string;
    queryVector: number[];
    numCandidates: number;
    limit?: number;
    filter?: any;
  };
  search?: {
    index: string;
    text: {
      query: string;
      path: string | string[];
    };
  };
}

let atlasConfig: AtlasVectorSearchConfig;

export function getAtlasConfig(): AtlasVectorSearchConfig {
  if (!atlasConfig) {
    const env = getEnvConfig();
    
    atlasConfig = {
      enabled: env.ATLAS_VECTOR_SEARCH_ENABLED,
      indexName: env.ATLAS_SEARCH_INDEX_NAME,
      vectorDimension: env.ATLAS_VECTOR_DIMENSION,
      similarity: env.ATLAS_VECTOR_SIMILARITY,
      candidates: env.ATLAS_VECTOR_CANDIDATES,
      scoreThreshold: env.ATLAS_SEARCH_SCORE_THRESHOLD,
      hybridWeightVector: 0.7, // 70% vector, 30% text
      hybridWeightText: 0.3
    };
  }
  
  return atlasConfig;
}

export function createVectorSearchPipeline(
  queryVector: number[],
  limit: number = 10,
  filter?: any
): AtlasSearchPipeline['vectorSearch'] {
  const config = getAtlasConfig();
  
  return {
    index: config.indexName,
    path: 'embedding',
    queryVector,
    numCandidates: Math.max(config.candidates, limit * 10),
    limit,
    filter
  };
}

export function createTextSearchPipeline(
  query: string,
  searchPaths: string[] = ['title', 'body', 'tags']
): AtlasSearchPipeline['search'] {
  const config = getAtlasConfig();
  
  return {
    index: `${config.indexName}_text`, // Separate text search index
    text: {
      query,
      path: searchPaths
    }
  };
}

export function createHybridSearchPipeline(
  queryVector: number[],
  textQuery: string,
  limit: number = 10,
  vectorWeight: number = 0.7
) {
  const config = getAtlasConfig();
  
  // MongoDB Atlas hybrid search aggregation pipeline
  return [
    {
      $vectorSearch: {
        index: config.indexName,
        path: 'embedding',
        queryVector,
        numCandidates: Math.max(config.candidates, limit * 10),
        limit: Math.ceil(limit * 1.5) // Get more candidates for hybrid scoring
      }
    },
    {
      $addFields: {
        vectorScore: { $meta: 'vectorSearchScore' }
      }
    },
    {
      $lookup: {
        from: 'articleembeddings', // Self lookup to get text search scores
        let: { docId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$_id', '$$docId'] },
              $text: { $search: textQuery }
            }
          },
          {
            $addFields: {
              textScore: { $meta: 'textScore' }
            }
          },
          {
            $project: { textScore: 1 }
          }
        ],
        as: 'textScores'
      }
    },
    {
      $addFields: {
        textScore: {
          $ifNull: [
            { $arrayElemAt: ['$textScores.textScore', 0] },
            0
          ]
        },
        hybridScore: {
          $add: [
            { $multiply: ['$vectorScore', vectorWeight] },
            { $multiply: [{ $ifNull: [{ $arrayElemAt: ['$textScores.textScore', 0] }, 0] }, 1 - vectorWeight] }
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
    }
  ];
}

export function validateAtlasIndexConfiguration() {
  const config = getAtlasConfig();
  
  const requirements = {
    enabled: config.enabled,
    validDimension: config.vectorDimension === 384,
    validSimilarity: ['cosine', 'euclidean', 'dotProduct'].includes(config.similarity),
    validCandidates: config.candidates >= 10 && config.candidates <= 10000,
    validThreshold: config.scoreThreshold >= 0 && config.scoreThreshold <= 1
  };
  
  const issues = Object.entries(requirements)
    .filter(([_, valid]) => !valid)
    .map(([key]) => key);
  
  return {
    valid: issues.length === 0,
    issues,
    config,
    recommendations: {
      'validDimension': 'Set ATLAS_VECTOR_DIMENSION=384 to match embedding model output',
      'validSimilarity': 'Use cosine, euclidean, or dotProduct for ATLAS_VECTOR_SIMILARITY',
      'validCandidates': 'Set ATLAS_VECTOR_CANDIDATES between 10-10000 (recommended: 100)',
      'validThreshold': 'Set ATLAS_SEARCH_SCORE_THRESHOLD between 0.0-1.0 (recommended: 0.3)'
    }
  };
}

export default {
  getAtlasConfig,
  createVectorSearchPipeline,
  createTextSearchPipeline,
  createHybridSearchPipeline,
  validateAtlasIndexConfiguration
};