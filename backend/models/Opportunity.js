const mongoose = require('mongoose');

const opportunitySchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ['Scholarship', 'Event', 'Training', 'Job', 'Other'], required: true },
  sport: { type: String, required: true },
  minScore: { type: Number, default: 0 },
  targetAgeMin: { type: Number, default: 0 },
  targetAgeMax: { type: Number, default: 100 },
  description: { type: String },
  deadline: { type: Date },
  link: { type: String },
  source: { type: String, default: 'Manual' },
  status: { type: String, enum: ['Pending', 'Verified', 'Rejected', 'Active'], default: 'Active' }
}, { timestamps: true });

module.exports = mongoose.model('Opportunity', opportunitySchema);
