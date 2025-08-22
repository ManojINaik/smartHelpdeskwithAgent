import crypto from 'crypto';

export interface EmbeddingResult {
  embedding: number[];
  model: string;
  dimensions: number;
}

export class VectorEmbeddingService {
  private readonly model: string = 'local-embeddings-v1';
  private readonly dimensions: number = 384; // Common embedding dimension
  
  /**
   * Generate embeddings for text using a simple but effective local approach
   * In production, you would replace this with OpenAI, Sentence Transformers, or similar
   */
  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty for embedding generation');
    }
    
    // Preprocess text
    const processedText = this.preprocessText(text);
    
    // Generate embedding using TF-IDF like approach with semantic features
    const embedding = this.generateLocalEmbedding(processedText);
    
    return {
      embedding,
      model: this.model,
      dimensions: this.dimensions
    };
  }
  
  /**
   * Generate embeddings for multiple texts in batch
   */
  async generateBatchEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
    const results: EmbeddingResult[] = [];
    
    for (const text of texts) {
      try {
        const result = await this.generateEmbedding(text);
        results.push(result);
      } catch (error) {
        console.error(`Failed to generate embedding for text: ${text.substring(0, 50)}...`, error);
        // Create zero embedding as fallback
        results.push({
          embedding: new Array(this.dimensions).fill(0),
          model: this.model,
          dimensions: this.dimensions
        });
      }
    }
    
    return results;
  }
  
  /**
   * Calculate cosine similarity between two embeddings
   */
  cosineSimilarity(embeddingA: number[], embeddingB: number[]): number {
    if (embeddingA.length !== embeddingB.length) {
      throw new Error('Embeddings must have the same dimensions');
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < embeddingA.length; i++) {
      const valueA = embeddingA[i];
      const valueB = embeddingB[i];
      
      if (valueA !== undefined && valueB !== undefined) {
        dotProduct += valueA * valueB;
        normA += valueA * valueA;
        normB += valueB * valueB;
      }
    }
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
  
  /**
   * Preprocess text for better embeddings
   */
  private preprocessText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }
  
  /**
   * Generate local embedding using a combination of techniques
   * This is a simplified approach - in production use proper embedding models
   */
  private generateLocalEmbedding(text: string): number[] {
    const words = text.split(/\s+/).filter(word => word.length > 2);
    const embedding = new Array(this.dimensions).fill(0);
    
    // Create feature vector based on various text characteristics
    const features = this.extractTextFeatures(text, words);
    
    // Map features to embedding dimensions
    for (let i = 0; i < this.dimensions; i++) {
      let value = 0;
      
      // Word frequency features (first 200 dimensions)
      if (i < 200) {
        const wordIndex = i % words.length;
        if (words[wordIndex]) {
          value = this.getWordScore(words[wordIndex], features);
        }
      }
      // Semantic features (next 100 dimensions)
      else if (i < 300) {
        const featureIndex = (i - 200) % features.semanticFeatures.length;
        value = features.semanticFeatures[featureIndex] || 0;
      }
      // Statistical features (remaining dimensions)
      else {
        const statIndex = (i - 300) % features.statisticalFeatures.length;
        value = features.statisticalFeatures[statIndex] || 0;
      }
      
      embedding[i] = value;
    }
    
    // Normalize the embedding
    return this.normalizeVector(embedding);
  }
  
  /**
   * Extract various features from text
   */
  private extractTextFeatures(text: string, words: string[]) {
    const wordFreq: { [key: string]: number } = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    // Semantic features based on domain-specific keywords
    const semanticCategories = {
      billing: ['payment', 'charge', 'refund', 'billing', 'invoice', 'money', 'cost', 'price', 'fee', 'subscription'],
      technical: ['error', 'bug', 'login', 'password', 'access', 'system', 'application', 'website', 'loading', 'connection'],
      shipping: ['delivery', 'shipping', 'package', 'tracking', 'order', 'shipment', 'address', 'carrier', 'fedex', 'ups'],
      support: ['help', 'support', 'assistance', 'question', 'issue', 'problem', 'trouble', 'difficulty']
    };
    
    const semanticFeatures: number[] = [];
    for (const [category, keywords] of Object.entries(semanticCategories)) {
      let score = 0;
      keywords.forEach(keyword => {
        if (text.includes(keyword)) {
          score += (wordFreq[keyword] || 0) + 0.5; // Bonus for presence
        }
      });
      semanticFeatures.push(score / keywords.length);
    }
    
    // Statistical features
    const statisticalFeatures = [
      text.length / 1000, // Text length normalized
      words.length / 100, // Word count normalized
      (text.match(/[A-Z]/g) || []).length / text.length, // Uppercase ratio
      (text.match(/[0-9]/g) || []).length / text.length, // Number ratio
      (text.match(/[.!?]/g) || []).length / text.length, // Punctuation ratio
      new Set(words).size / words.length, // Unique word ratio
      this.getAverageWordLength(words),
      this.getSentenceComplexity(text)
    ];
    
    return {
      wordFrequency: wordFreq,
      semanticFeatures,
      statisticalFeatures
    };
  }
  
  /**
   * Get score for a word based on its characteristics
   */
  private getWordScore(word: string, features: any): number {
    const freq = features.wordFrequency[word] || 0;
    const length = word.length;
    const complexity = length > 5 ? 1.2 : 1.0;
    
    return (freq * complexity) / 10; // Normalize
  }
  
  /**
   * Calculate average word length
   */
  private getAverageWordLength(words: string[]): number {
    if (words.length === 0) return 0;
    return words.reduce((sum, word) => sum + word.length, 0) / words.length / 10;
  }
  
  /**
   * Calculate sentence complexity score
   */
  private getSentenceComplexity(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length === 0) return 0;
    
    const avgSentenceLength = sentences.reduce((sum, sentence) => {
      return sum + sentence.trim().split(/\s+/).length;
    }, 0) / sentences.length;
    
    return Math.min(avgSentenceLength / 20, 1); // Normalize to [0,1]
  }
  
  /**
   * Normalize vector to unit length
   */
  private normalizeVector(vector: number[]): number[] {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude === 0) return vector;
    
    return vector.map(val => val / magnitude);
  }
  
  /**
   * Split large text into chunks for embedding
   */
  chunkText(text: string, maxChunkSize: number = 1000, overlap: number = 100): string[] {
    if (text.length <= maxChunkSize) {
      return [text];
    }
    
    const chunks: string[] = [];
    let start = 0;
    
    while (start < text.length) {
      let end = Math.min(start + maxChunkSize, text.length);
      
      // Try to end at a sentence boundary
      if (end < text.length) {
        const lastSentenceEnd = text.lastIndexOf('.', end);
        const lastQuestionEnd = text.lastIndexOf('?', end);
        const lastExclamationEnd = text.lastIndexOf('!', end);
        
        const sentenceEnd = Math.max(lastSentenceEnd, lastQuestionEnd, lastExclamationEnd);
        
        if (sentenceEnd > start + maxChunkSize * 0.5) {
          end = sentenceEnd + 1;
        }
      }
      
      chunks.push(text.substring(start, end).trim());
      start = Math.max(end - overlap, start + 1);
    }
    
    return chunks.filter(chunk => chunk.length > 10); // Filter out very short chunks
  }
}

export default new VectorEmbeddingService();