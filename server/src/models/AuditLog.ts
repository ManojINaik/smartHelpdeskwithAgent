import { Schema, model } from 'mongoose';
import { IAuditLog, ActorType } from '../types/models.js';

const auditLogSchema = new Schema<IAuditLog>({
  ticketId: {
    type: Schema.Types.ObjectId,
    ref: 'Ticket',
    required: [true, 'Ticket ID is required']
  },
  traceId: {
    type: String,
    required: [true, 'Trace ID is required'],
    maxlength: [100, 'Trace ID cannot exceed 100 characters'],
    index: true
  },
  actor: {
    type: String,
    enum: {
      values: ['system', 'agent', 'user'] as ActorType[],
      message: 'Actor must be one of: system, agent, user'
    },
    required: [true, 'Actor is required']
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    maxlength: [100, 'Action cannot exceed 100 characters'],
    uppercase: true // Store actions in uppercase for consistency
  },
  meta: {
    type: Schema.Types.Mixed,
    default: {},
    validate: {
      validator: function(meta: any) {
        // Ensure meta object is not too large (prevent DoS)
        const jsonString = JSON.stringify(meta);
        return jsonString.length <= 10000; // 10KB limit
      },
      message: 'Meta data cannot exceed 10KB when serialized'
    }
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    immutable: true // Prevent modification of timestamp
  }
}, {
  timestamps: false, // We use our own timestamp field
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  // Make the entire document immutable after creation
  strict: true
});

// Indexes for optimal query performance (avoid duplicate traceId index)
auditLogSchema.index({ ticketId: 1, timestamp: -1 });
auditLogSchema.index({ actor: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ timestamp: -1 });

// Compound indexes for common queries
auditLogSchema.index({ ticketId: 1, actor: 1, timestamp: -1 });
auditLogSchema.index({ traceId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

// TTL index for automatic cleanup (optional - keep logs for 1 year)
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

// Pre-save middleware for data normalization
auditLogSchema.pre('save', function(next) {
  // Normalize action to uppercase
  if (this.isModified('action')) {
    this.action = this.action.toUpperCase().replace(/\s+/g, '_');
  }

  // Sanitize meta data to remove sensitive information
  if (this.isModified('meta')) {
    (this as any).meta = (this as any).sanitizeMeta((this as any).meta);
  }

  next();
});

// Pre-validate middleware to prevent updates
auditLogSchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate'], function(next) {
  next(new Error('Audit logs are immutable and cannot be updated'));
});

// Static method to create audit log entry
auditLogSchema.statics.createEntry = function(
  ticketId: string,
  traceId: string,
  actor: ActorType,
  action: string,
  meta: Record<string, any> = {}
) {
  return this.create({
    ticketId,
    traceId,
    actor,
    action,
    meta,
    timestamp: new Date()
  });
};

// Static method to find logs by ticket
auditLogSchema.statics.findByTicket = function(ticketId: string) {
  return this.find({ ticketId }).sort({ timestamp: -1 });
};

// Static method to find logs by trace ID
auditLogSchema.statics.findByTrace = function(traceId: string) {
  return this.find({ traceId }).sort({ timestamp: -1 });
};

// Static method to find logs by action
auditLogSchema.statics.findByAction = function(action: string) {
  return this.find({ action: action.toUpperCase() }).sort({ timestamp: -1 });
};

// Static method to find logs by actor
auditLogSchema.statics.findByActor = function(actor: ActorType) {
  return this.find({ actor }).sort({ timestamp: -1 });
};

// Static method to find logs in date range
auditLogSchema.statics.findByDateRange = function(startDate: Date, endDate: Date) {
  return this.find({
    timestamp: { $gte: startDate, $lte: endDate }
  }).sort({ timestamp: -1 });
};

// Static method to get audit trail for ticket
auditLogSchema.statics.getAuditTrail = function(ticketId: string) {
  return this.find({ ticketId })
    .sort({ timestamp: 1 }) // Chronological order for trail
    .populate('ticketId', 'title status');
};

// Static method to get system activity summary
auditLogSchema.statics.getActivitySummary = async function(hours: number = 24) {
  const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  const pipeline = [
    { $match: { timestamp: { $gte: startDate } } },
    {
      $group: {
        _id: {
          action: '$action',
          actor: '$actor'
        },
        count: { $sum: 1 },
        lastOccurrence: { $max: '$timestamp' }
      }
    },
    {
      $group: {
        _id: '$_id.action',
        totalCount: { $sum: '$count' },
        byActor: {
          $push: {
            actor: '$_id.actor',
            count: '$count',
            lastOccurrence: '$lastOccurrence'
          }
        }
      }
    },
    { $sort: { totalCount: -1 } }
  ];

  return (this as any).aggregate(pipeline as any);
};

// Instance method to sanitize meta data
auditLogSchema.methods.sanitizeMeta = function(meta: any): any {
  if (!meta || typeof meta !== 'object') {
    return meta;
  }

  const sensitiveKeys = [
    'password', 'token', 'secret', 'key', 'auth', 'credential',
    'ssn', 'social', 'credit', 'card', 'cvv', 'pin'
  ];

  const sanitized = { ...meta };

  const sanitizeObject = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(item => sanitizeObject(item));
    }

    if (obj && typeof obj === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        const isSensitive = sensitiveKeys.some(sensitiveKey => 
          lowerKey.includes(sensitiveKey)
        );

        if (isSensitive) {
          result[key] = '[REDACTED]';
        } else {
          result[key] = sanitizeObject(value);
        }
      }
      return result;
    }

    return obj;
  };

  return sanitizeObject(sanitized);
};

// Virtual for formatted timestamp
auditLogSchema.virtual('formattedTimestamp').get(function() {
  return this.timestamp.toISOString();
});

// Virtual for age in minutes
auditLogSchema.virtual('ageInMinutes').get(function() {
  return Math.floor((Date.now() - this.timestamp.getTime()) / (1000 * 60));
});

// Virtual for human-readable action
auditLogSchema.virtual('readableAction').get(function() {
  return this.action.toLowerCase().replace(/_/g, ' ');
});

// Instance method to check if log is recent
auditLogSchema.methods.isRecent = function(minutes: number = 5): boolean {
  const ageInMinutes = Math.floor((Date.now() - this.timestamp.getTime()) / (1000 * 60));
  return ageInMinutes <= minutes;
};

// Instance method to get related logs (same trace ID)
auditLogSchema.methods.getRelatedLogs = function() {
  return (this.model('AuditLog') as any).find({ traceId: (this as any).traceId }).sort({ timestamp: 1 });
};

export const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);
export default AuditLog;