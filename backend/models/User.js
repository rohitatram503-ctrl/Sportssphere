const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Athlete', 'Organizer', 'Admin'], required: true },
  // Athlete Profile Fields embedded directly for simplicity, or we can use a separate model.
  // Using embedded as it simplifies the query since it's 1-to-1
  age: { type: Number },
  interestedSports: [{ type: String }],
  experience: { type: String },
  performanceScore: { type: Number, default: 0 },
  badges: [{
    name: String,
    category: String,
    description: String,
    icon: String,
    achievedAt: { type: Date, default: Date.now }
  }],
  status: { type: String, enum: ['Active', 'Suspended'], default: 'Active' },
  performances: [{
    sport: String,
    role: String,
    performanceData: mongoose.Schema.Types.Mixed,
    date: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
