import { Schema, model } from 'mongoose';
import { IAgentSuggestion, IModelInfo } from '../types/models.js';

// Model info sub-schema
const modelInfoSchema = new Schema<IModelInfo>({
  provider: {
    type: String,
    required: [true, 'Model provider is required'],
    enum: {
      values: ['gemini', 'stub', 'openai', 'claude'],
      message: 'Provider must be one of: gemini, stub, openai, claude'
    }
  },
  model: {
    type: String,
    required: [true, 'Model name is required'],
    maxlength: [100, 'Model name cannot exceed 100 characters']
  },
  promptVersion: {
    type: String,
    required: [true, 'Prompt version is required'],
    maxlength: [50, 'Prompt version cannot exceed 50 characters']
  },
  latencyMs: {
    type: Number,
    required: [true, 'Latency is required'],
    min: [0, 'Latency cannot be negative'],
    max: [300000, 'Latency cannot exceed 5 minutes (300000ms)']
  }
}, { _id: false });

const agentSuggestionSchema = new Schema<IAgentSuggestion>({
  ticketId: {
    type: Schema.Types.ObjectId,
    ref: 'Ticket',
    required: [true, 'Ticket ID is required'],
    unique: true // One suggestion per ticket
  },
  predictedCategory: {
    type: String,
    required: [true, 'Predicted category is required'],
    enum: {
      values: ['billing', 'tech', 'shipping', 'other'],
      message: 'Predicted category must be one of: billing, tech, shipping, other'
    }
  },
  articleIds: {
    type: [Schema.Types.ObjectId],
    ref: 'Article',
    default: [],
    validate: {
      validator: function(articleIds: any[]) {
        return articleIds.length <= 10; // Maximum 10 referenced articles
      },
      message: 'Cannot reference more than 10 articles'
    }
  },
  draftReply: {
    type: String,
    required: [true, 'Draft reply is required'],
    minlength: [10, 'Draft reply must be at least 10 characters long'],
    maxlength: [5000, 'Draft reply cannot exceed 5,000 characters']
  },
  confidence: {
    type: Number,
    required: [true, 'Confidence score is required'],
    min: [0, 'Confidence cannot be less than 0'],
    max: [1, 'Confidence cannot be greater than 1']
  },
  autoClosed: {
    type: Boolean,
    default: false,
    required: true
  },
  modelInfo: {
    type: modelInfoSchema,
    required: [true, 'Model info is required']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for optimal query performance
agentSuggestionSchema.index({ ticketId: 1 }, { unique: true });
agentSuggestionSchema.index({ predictedCategory: 1 });
agentSuggestionSchema.index({ confidence: -1 });
agentSuggestionSchema.index({ autoClosed: 1 });
agentSuggestionSchema.index({ createdAt: -1 });
agentSuggestionSchema.index({ 'modelInfo.provider': 1 });

// Compound indexes for analytics queries
agentSuggestionSchema.index({ predictedCategory: 1, confidence: -1 });
agentSuggestionSchema.index({ autoClosed: 1, confidence: -1 });
agentSuggestionSchema.index({ 'modelInfo.provider': 1, createdAt: -1 });

// Pre-save middleware for validation
agentSuggestionSchema.pre('save', function(next) {
  // Round confidence to 3 decimal places
  if (this.isModified('confidence')) {
    this.confidence = Math.round(this.confidence * 1000) / 1000;
  }

  // Validate that auto-closed suggestions have high confidence
  if (this.autoClosed && this.confidence < 0.7) {
    return next(new Error('Auto-closed suggestions must have confidence >= 0.7'));
  }

  next();
});

// Static method to find suggestions by confidence range
agentSuggestionSchema.statics.findByConfidenceRange = function(minConfidence: number, maxConfidence: number = 1) {
  return this.find({
    confidence: { $gte: minConfidence, $lte: maxConfidence }
  }).populate('ticketId articleIds');
};

// Static method to find auto-closed suggestions
agentSuggestionSchema.statics.findAutoClosed = function() {
  return this.find({ autoClosed: true }).populate('ticketId');
};

// Static method to find suggestions by category
agentSuggestionSchema.statics.findByCategory = function(category: string) {
  return this.find({ predictedCategory: category }).populate('ticketId articleIds');
};

// Static method to find suggestions by provider
agentSuggestionSchema.statics.findByProvider = function(provider: string) {
  return this.find({ 'modelInfo.provider': provider }).populate('ticketId');
};

// Static method to get performance metrics
agentSuggestionSchema.statics.getPerformanceMetrics = async function() {
  const pipeline = [
    {
      $group: {
        _id: '$modelInfo.provider',
        totalSuggestions: { $sum: 1 },
        autoClosedCount: { $sum: { $cond: ['$autoClosed', 1, 0] } },
        avgConfidence: { $avg: '$confidence' },
        avgLatency: { $avg: '$modelInfo.latencyMs' },
        maxLatency: { $max: '$modelInfo.latencyMs' },
        minLatency: { $min: '$modelInfo.latencyMs' }
      }
    },
    {
      $addFields: {
        autoCloseRate: { $divide: ['$autoClosedCount', '$totalSuggestions'] }
      }
    }
  ];

  return this.aggregate(pipeline);
};

// Virtual for confidence percentage
agentSuggestionSchema.virtual('confidencePercentage').get(function() {
  return Math.round(this.confidence * 100);
});

// Virtual for confidence level
agentSuggestionSchema.virtual('confidenceLevel').get(function() {
  if (this.confidence >= 0.9) return 'very_high';
  if (this.confidence >= 0.8) return 'high';
  if (this.confidence >= 0.6) return 'medium';
  if (this.confidence >= 0.4) return 'low';
  return 'very_low';
});

// Virtual for performance rating
agentSuggestionSchema.virtual('performanceRating').get(function() {
  const latency = this.modelInfo.latencyMs;
  if (latency < 1000) return 'excellent';
  if (latency < 3000) return 'good';
  if (latency < 10000) return 'fair';
  return 'poor';
});

// Instance method to check if suggestion should be auto-closed
agentSuggestionSchema.methods.shouldAutoClose = function(threshold: number = 0.8): boolean {
  return this.confidence >= threshold;
};

// Instance method to get cited articles
agentSuggestionSchema.methods.getCitedArticles = function() {
  return this.populate('articleIds');
};

// Instance method to calculate accuracy (would need actual outcome data)
agentSuggestionSchema.methods.calculateAccuracy = function(actualCategory: string): number {
  return this.predictedCategory === actualCategory ? 1 : 0;
};

export const AgentSuggestion = model<IAgentSuggestion>('AgentSuggestion', agentSuggestionSchema);
export default AgentSuggestion;