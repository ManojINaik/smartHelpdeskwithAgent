import { Schema, model } from 'mongoose';
import { IConfig } from '../types/models.js';
import { getEnvConfig } from '../config/env.js';

const envDefaults = getEnvConfig();

const configSchema = new Schema<IConfig>({
  autoCloseEnabled: {
    type: Boolean,
    required: true,
    default: envDefaults.AUTO_CLOSE_ENABLED
  },
  confidenceThreshold: {
    type: Number,
    required: true,
    min: [0, 'Confidence threshold cannot be less than 0'],
    max: [1, 'Confidence threshold cannot be greater than 1'],
    default: envDefaults.CONFIDENCE_THRESHOLD
  },
  slaHours: {
    type: Number,
    required: true,
    min: [1, 'SLA hours must be at least 1'],
    max: [24 * 14, 'SLA hours cannot exceed 14 days'],
    default: envDefaults.SLA_HOURS
  },
  emailNotificationsEnabled: {
    type: Boolean,
    required: true,
    default: false
  },
  maxAttachmentSize: {
    type: Number,
    required: true,
    min: [0, 'Max attachment size cannot be negative'],
    max: [104857600, 'Max attachment size cannot exceed 100 MB'],
    default: envDefaults.MAX_FILE_SIZE
  },
  allowedAttachmentTypes: {
    type: [String],
    default: envDefaults.ALLOWED_FILE_TYPES.split(',').map(t => t.trim().toLowerCase()),
    validate: {
      validator: function(types: string[]) {
        if (!Array.isArray(types)) return false;
        if (types.length > 50) return false;
        return types.every(t => typeof t === 'string' && t.length > 0 && t.length <= 20);
      },
      message: 'Allowed attachment types invalid or exceed limits'
    }
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'updatedBy (admin user) is required']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for optimal queries
configSchema.index({ updatedAt: -1 });
configSchema.index({ updatedBy: 1, updatedAt: -1 });

// Normalize and guard values before save
configSchema.pre('save', function(next) {
  // Clamp threshold into [0,1]
  if (this.isModified('confidenceThreshold')) {
    if (this.confidenceThreshold < 0) this.confidenceThreshold = 0;
    if (this.confidenceThreshold > 1) this.confidenceThreshold = 1;
  }

  // Normalize allowedAttachmentTypes: lowercase, ensure starts with dot, dedupe
  if (this.isModified('allowedAttachmentTypes')) {
    const normalized = (this.allowedAttachmentTypes || [])
      .map(t => t.trim().toLowerCase())
      .map(t => (t.startsWith('.') ? t : `.${t}`))
      .filter(t => t.length > 1 && t.length <= 20);
    this.allowedAttachmentTypes = Array.from(new Set(normalized));
  }

  // Ensure maxAttachmentSize respects upper bound
  if (this.isModified('maxAttachmentSize')) {
    if (this.maxAttachmentSize < 0) this.maxAttachmentSize = 0;
    if (this.maxAttachmentSize > 104857600) this.maxAttachmentSize = 104857600; // 100 MB
  }

  next();
});

// Helpful statics
configSchema.statics.getLatest = function() {
  return this.findOne({}).sort({ updatedAt: -1 });
};

configSchema.statics.findAll = function() {
  return this.find({}).sort({ updatedAt: -1 });
};

export const Config = model<IConfig>('Config', configSchema);
export default Config;



