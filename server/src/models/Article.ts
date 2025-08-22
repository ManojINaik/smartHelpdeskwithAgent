import { Schema, model } from 'mongoose';
import { IArticle, ArticleStatus } from '../types/models.js';

const articleSchema = new Schema<IArticle>({
  title: {
    type: String,
    required: [true, 'Article title is required'],
    trim: true,
    minlength: [5, 'Title must be at least 5 characters long'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  body: {
    type: String,
    required: [true, 'Article body is required'],
    minlength: [5, 'Article body must be at least 5 characters long'],
    maxlength: [50000, 'Article body cannot exceed 50,000 characters']
  },
  tags: {
    type: [String],
    default: [],
    validate: {
      validator: function(tags: string[]) {
        return tags.length <= 20; // Maximum 20 tags
      },
      message: 'Cannot have more than 20 tags'
    }
  },
  status: {
    type: String,
    enum: {
      values: ['draft', 'published'] as ArticleStatus[],
      message: 'Status must be either draft or published'
    },
    default: 'draft',
    required: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Article must have a creator']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for optimal query performance
articleSchema.index({ title: 'text', body: 'text', tags: 'text' }); // Full-text search
articleSchema.index({ status: 1 });
articleSchema.index({ createdBy: 1 });
articleSchema.index({ tags: 1 });
articleSchema.index({ createdAt: -1 });
articleSchema.index({ updatedAt: -1 });

// Compound indexes for common queries
articleSchema.index({ status: 1, createdAt: -1 });
articleSchema.index({ createdBy: 1, status: 1 });

// Pre-save middleware to normalize tags
articleSchema.pre('save', function(next) {
  if (this.isModified('tags')) {
    // Normalize tags: lowercase, trim, remove duplicates
    this.tags = [...new Set(
      this.tags
        .map(tag => tag.toLowerCase().trim())
        .filter(tag => tag.length > 0 && tag.length <= 50)
    )];
  }
  next();
});

// Static method to find published articles
articleSchema.statics.findPublished = function() {
  return this.find({ status: 'published' });
};

// Static method to search articles by text
articleSchema.statics.searchByText = function(query: string, includeUnpublished = false) {
  const filter: any = {
    $text: { $search: query }
  };
  
  if (!includeUnpublished) {
    filter.status = 'published';
  }
  
  return this.find(filter, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } });
};

// Static method to find articles by tags
articleSchema.statics.findByTags = function(tags: string[], includeUnpublished = false) {
  const filter: any = {
    tags: { $in: tags.map(tag => tag.toLowerCase()) }
  };
  
  if (!includeUnpublished) {
    filter.status = 'published';
  }
  
  return this.find(filter);
};

// Static method to find articles by creator
articleSchema.statics.findByCreator = function(creatorId: string) {
  return this.find({ createdBy: creatorId }).populate('createdBy', 'name email');
};

// Virtual for article summary (first 200 characters of body)
articleSchema.virtual('summary').get(function() {
  if (this.body.length <= 200) {
    return this.body;
  }
  return this.body.substring(0, 200) + '...';
});

// Virtual for word count
articleSchema.virtual('wordCount').get(function() {
  return this.body.split(/\s+/).filter(word => word.length > 0).length;
});

// Virtual for reading time estimate (assuming 200 words per minute)
articleSchema.virtual('readingTimeMinutes').get(function() {
  const wordCount = this.body.split(/\s+/).filter(word => word.length > 0).length;
  return Math.ceil(wordCount / 200);
});

// Instance method to check if article is searchable
articleSchema.methods.isSearchable = function(): boolean {
  return this.status === 'published';
};

// Instance method to get relevance score for a query
articleSchema.methods.getRelevanceScore = function(query: string): number {
  const queryWords = query.toLowerCase().split(/\s+/);
  const titleWords = this.title.toLowerCase().split(/\s+/);
  const bodyWords = this.body.toLowerCase().split(/\s+/);
  const tags = this.tags.map((tag: string) => tag.toLowerCase());
  
  let score = 0;
  
  // Title matches get highest weight
  queryWords.forEach((word: string) => {
    if (titleWords.some((titleWord: string) => titleWord.includes(word))) {
      score += 10;
    }
    if (tags.some((tag: string) => tag.includes(word))) {
      score += 8;
    }
    if (bodyWords.some((bodyWord: string) => bodyWord.includes(word))) {
      score += 1;
    }
  });
  
  return score;
};

// Post-save middleware for embedding generation
articleSchema.post('save', function(doc) {
  // Trigger embedding generation for published articles (async)
  if (doc.status === 'published') {
    import('../services/rag.service.js').then(({ default: RAGService }) => {
      RAGService.generateEmbeddingForArticle(String(doc._id))
        .then(() => {
          console.log(`✅ Auto-generated embedding for article ${doc._id}`);
        })
        .catch((error: any) => {
          console.error(`❌ Auto-embedding failed for article ${doc._id}:`, error);
        });
    }).catch(() => {
      // Ignore import errors in case RAG service is not available
    });
  }
});

export const Article = model<IArticle>('Article', articleSchema);
export default Article;