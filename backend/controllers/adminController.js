const User = require('../models/User');
const Event = require('../models/Event');
const Opportunity = require('../models/Opportunity');
const Participation = require('../models/Participation');
const { sendInAppNotification } = require('../services/notificationService');

// --- USER MANAGEMENT ---
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (user.role === 'Admin' && role !== 'Admin') {
      const adminCount = await User.countDocuments({ role: 'Admin' });
      if (adminCount <= 1) return res.status(400).json({ message: 'Cannot demote the last Admin' });
    }
    
    user.role = role;
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.status = status;
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'Admin') return res.status(400).json({ message: 'Cannot delete Admin accounts' });
    
    await User.findByIdAndDelete(req.params.id);
    await Participation.deleteMany({ athlete: req.params.id });
    await Event.deleteMany({ organizer: req.params.id });
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- EVENT VERIFICATION ---
exports.updateEventVerification = async (req, res) => {
  try {
    const { verificationStatus } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    
    const wasPending = event.verificationStatus === 'Pending';
    event.verificationStatus = verificationStatus;
    await event.save();
    
    // Notify if freshly approved
    if (wasPending && verificationStatus === 'Approved') {
      // Notify Organizer
      await sendInAppNotification({
        userId: event.organizer,
        title: 'Event Approved',
        message: `Your event "${event.title}" has been approved by the Admin and is now live!`,
        type: 'event',
        referenceId: event._id,
        referenceModel: 'Event',
        sendEmail: true
      });

      // Notify Athletes
      const athletes = await User.find({ role: 'Athlete', interestedSports: event.sport });
      for (const athlete of athletes) {
        await sendInAppNotification({
          userId: athlete._id,
          title: 'New Event Added',
          message: `A new ${event.sport} event "${event.title}" has been scheduled for ${new Date(event.date).toLocaleDateString()}. Check it out!`,
          type: 'event',
          referenceId: event._id,
          referenceModel: 'Event',
          sendEmail: true
        });
      }
    }
    
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- OPPORTUNITY MANAGEMENT ---
exports.getOpportunities = async (req, res) => {
  try {
    const opportunities = await Opportunity.find().sort({ createdAt: -1 });
    res.json(opportunities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createOpportunity = async (req, res) => {
  try {
    const opp = await Opportunity.create(req.body);
    res.status(201).json(opp);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateOpportunity = async (req, res) => {
  try {
    const opp = await Opportunity.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    res.json(opp);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteOpportunity = async (req, res) => {
  try {
    await Opportunity.findByIdAndDelete(req.params.id);
    res.json({ message: 'Opportunity deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.fetchOpportunities = async (req, res) => {
  try {
    // Simulated mock data from external API / Scraper
    const fetchedData = [
      {
        title: 'National Athletics Scholarship 2026',
        type: 'Scholarship',
        sport: 'Athletics',
        minScore: 50,
        targetAgeMin: 14,
        targetAgeMax: 20,
        description: 'Government scholarship for upcoming track and field athletes.',
        deadline: new Date(new Date().setMonth(new Date().getMonth() + 2)), // 2 months from now
        source: 'Auto-Fetched',
        status: 'Pending'
      },
      {
        title: 'Pro Football Winter Training Camp',
        type: 'Training',
        sport: 'Football',
        minScore: 60,
        targetAgeMin: 16,
        targetAgeMax: 22,
        description: 'High-intensity training camp organized by top clubs.',
        deadline: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        source: 'Auto-Fetched',
        status: 'Pending'
      },
      {
        title: 'State Level Swimming Championship',
        type: 'Event',
        sport: 'Swimming',
        minScore: 40,
        targetAgeMin: 12,
        targetAgeMax: 18,
        description: 'Annual state swimming championship with cash prizes.',
        source: 'Auto-Fetched',
        status: 'Pending'
      }
    ];

    const created = await Opportunity.insertMany(fetchedData);
    res.status(201).json({ message: 'Successfully fetched opportunities', count: created.length, opportunities: created });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- SYSTEM ANALYTICS ---
exports.getSystemStats = async (req, res) => {
  try {
    const users = await User.countDocuments();
    const athletes = await User.countDocuments({ role: 'Athlete' });
    const organizers = await User.countDocuments({ role: 'Organizer' });
    const admins = await User.countDocuments({ role: 'Admin' });
    
    const events = await Event.countDocuments();
    const upcomingEvents = await Event.countDocuments({ status: 'Upcoming' });
    const completedEvents = await Event.countDocuments({ status: 'Completed' });
    
    const opportunities = await Opportunity.countDocuments();
    const participations = await Participation.countDocuments();
    
    res.json({
      users: { total: users, athletes, organizers, admins },
      events: { total: events, upcoming: upcomingEvents, completed: completedEvents },
      opportunities,
      participations
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
