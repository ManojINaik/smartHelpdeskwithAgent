import { Schema, model } from 'mongoose';

const preferenceSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  inAppEnabled: { type: Boolean, default: true, required: true },
  emailEnabled: { type: Boolean, default: false, required: true },
}, {
  timestamps: true,
});

preferenceSchema.index({ userId: 1 }, { unique: true });

export const Preference = model('Preference', preferenceSchema);
export default Preference;


