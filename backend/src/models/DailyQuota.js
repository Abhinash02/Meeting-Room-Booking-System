import mongoose from 'mongoose';

const dailyQuotaSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true },
    date: { type: String, required: true },
    usedMinutes: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

dailyQuotaSchema.index({ email: 1, date: 1 }, { unique: true });

export default mongoose.models.DailyQuota ||
  mongoose.model('DailyQuota', dailyQuotaSchema);
