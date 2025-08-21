import { Schema, model } from 'mongoose';
import { ITicket, IReply, TicketCategory, TicketStatus, AuthorType } from '../types/models.js';

// Reply sub-schema
const replySchema = new Schema<IReply>({
  content: {
    type: String,
    required: [true, 'Reply content is required'],
    minlength: [1, 'Reply content cannot be empty'],
    maxlength: [10000, 'Reply content cannot exceed 10,000 characters']
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Reply must have an author']
  },
  authorType: {
    type: String,
    enum: {
      values: ['user', 'agent', 'system'] as AuthorType[],
      message: 'Author type must be one of: user, agent, system'
    },
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ticketSchema = new Schema<ITicket>({
  title: {
    type: String,
    required: [true, 'Ticket title is required'],
    trim: true,
    minlength: [5, 'Title must be at least 5 characters long'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Ticket description is required'],
    minlength: [10, 'Description must be at least 10 characters long'],
    maxlength: [5000, 'Description cannot exceed 5,000 characters']
  },
  category: {
    type: String,
    enum: {
      values: ['billing', 'tech', 'shipping', 'other'] as TicketCategory[],
      message: 'Category must be one of: billing, tech, shipping, other'
    },
    default: 'other',
    required: true
  },
  status: {
    type: String,
    enum: {
      values: ['open', 'triaged', 'waiting_human', 'resolved', 'closed'] as TicketStatus[],
      message: 'Status must be one of: open, triaged, waiting_human, resolved, closed'
    },
    default: 'open',
    required: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Ticket must have a creator']
  },
  assignee: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  agentSuggestionId: {
    type: Schema.Types.ObjectId,
    ref: 'AgentSuggestion',
    default: null
  },
  attachmentUrls: {
    type: [String],
    default: [],
    validate: {
      validator: function(urls: string[]) {
        return urls.length <= 10; // Maximum 10 attachments
      },
      message: 'Cannot have more than 10 attachments'
    }
  },
  attachmentExtracts: {
    type: [
      new Schema({
        url: String,
        contentType: String,
        textSnippet: String,
        bytes: Number,
      }, { _id: false })
    ],
    default: []
  },
  replies: {
    type: [replySchema],
    default: []
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for optimal query performance
ticketSchema.index({ createdBy: 1 });
ticketSchema.index({ assignee: 1 });
ticketSchema.index({ status: 1 });
ticketSchema.index({ category: 1 });
ticketSchema.index({ createdAt: -1 });
ticketSchema.index({ updatedAt: -1 });
ticketSchema.index({ agentSuggestionId: 1 });

// Compound indexes for common queries
ticketSchema.index({ status: 1, createdAt: -1 });
ticketSchema.index({ assignee: 1, status: 1 });
ticketSchema.index({ createdBy: 1, status: 1 });
ticketSchema.index({ category: 1, status: 1 });

// Text search index for title and description
ticketSchema.index({ title: 'text', description: 'text' });

// Pre-save middleware for status transitions
ticketSchema.pre('save', function(next) {
  // Auto-assign category based on keywords if not manually set
  if (this.isNew && this.category === 'other') {
    const content = `${this.title} ${this.description}`.toLowerCase();
    
    if (content.includes('bill') || content.includes('payment') || content.includes('invoice') || content.includes('charge')) {
      this.category = 'billing';
    } else if (content.includes('ship') || content.includes('delivery') || content.includes('tracking')) {
      this.category = 'shipping';
    } else if (content.includes('bug') || content.includes('error') || content.includes('not working') || content.includes('technical')) {
      this.category = 'tech';
    }
  }

  next();
});

// Post-save middleware for audit logging
ticketSchema.post('save', function(doc) {
  // This will be used by the audit logging system
  // The actual audit log creation will be handled by the service layer
  console.log(`Ticket ${doc._id} saved with status: ${doc.status}`);
});

// Static method to find tickets by status
ticketSchema.statics.findByStatus = function(status: TicketStatus) {
  return this.find({ status }).populate('createdBy assignee', 'name email');
};

// Static method to find tickets by assignee
ticketSchema.statics.findByAssignee = function(assigneeId: string) {
  return this.find({ assignee: assigneeId }).populate('createdBy', 'name email');
};

// Static method to find tickets by creator
ticketSchema.statics.findByCreator = function(creatorId: string) {
  return this.find({ createdBy: creatorId }).populate('assignee', 'name email');
};

// Static method to find unassigned tickets
ticketSchema.statics.findUnassigned = function() {
  return this.find({ assignee: null, status: { $in: ['open', 'triaged', 'waiting_human'] } })
    .populate('createdBy', 'name email');
};

// Static method to search tickets by text
ticketSchema.statics.searchByText = function(query: string) {
  return this.find(
    { $text: { $search: query } },
    { score: { $meta: 'textScore' } }
  ).sort({ score: { $meta: 'textScore' } })
   .populate('createdBy assignee', 'name email');
};

// Virtual for reply count
ticketSchema.virtual('replyCount').get(function() {
  return this.replies.length;
});

// Virtual for last reply
ticketSchema.virtual('lastReply').get(function() {
  if (this.replies.length === 0) return null;
  return this.replies[this.replies.length - 1];
});

// Virtual for is assigned
ticketSchema.virtual('isAssigned').get(function() {
  return this.assignee !== null && this.assignee !== undefined;
});

// Virtual for is resolved
ticketSchema.virtual('isResolved').get(function() {
  return this.status === 'resolved' || this.status === 'closed';
});

// Virtual for age in hours
ticketSchema.virtual('ageInHours').get(function() {
  return Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60));
});

// Instance method to add reply
ticketSchema.methods.addReply = function(content: string, authorId: string, authorType: AuthorType) {
  this.replies.push({
    content,
    author: authorId,
    authorType,
    createdAt: new Date()
  });
  return this.save();
};

// Instance method to assign ticket
ticketSchema.methods.assignTo = function(assigneeId: string) {
  this.assignee = assigneeId;
  if (this.status === 'open') {
    this.status = 'waiting_human';
  }
  return this.save();
};

// Instance method to resolve ticket
ticketSchema.methods.resolve = function(resolutionNote?: string) {
  this.status = 'resolved';
  if (resolutionNote) {
    this.replies.push({
      content: resolutionNote,
      author: this.assignee || this.createdBy,
      authorType: 'system',
      createdAt: new Date()
    });
  }
  return this.save();
};

// Instance method to check if ticket needs attention (SLA breach)
ticketSchema.methods.needsAttention = function(slaHours: number = 24): boolean {
  const ageInHours = this.ageInHours;
  return ageInHours > slaHours && !this.isResolved;
};

export const Ticket = model<ITicket>('Ticket', ticketSchema);
export default Ticket;