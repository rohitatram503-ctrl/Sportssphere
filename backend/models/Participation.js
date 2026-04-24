const mongoose = require('mongoose');

const participationSchema = new mongoose.Schema({
  athlete: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  result: { type: String, enum: ['Win', 'Loss', 'Draw', 'Pending'], default: 'Pending' },
  rank: { type: Number }
}, { timestamps: true });

module.exports = mongoose.model('Participation', participationSchema);
