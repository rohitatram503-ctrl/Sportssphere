const mongoose = require('mongoose');

const performanceSchema = new mongoose.Schema({
  athleteId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  sport: { type: String, required: true },
  role: { type: String },
  performanceData: { type: mongoose.Schema.Types.Mixed },
  performanceScore: { type: Number, default: 0 }
}, { timestamps: true });

// Prevent duplicate entries per athlete per event
performanceSchema.index({ athleteId: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.model('Performance', performanceSchema);
