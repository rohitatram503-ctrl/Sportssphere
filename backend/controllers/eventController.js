const Event = require('../models/Event');
const Participation = require('../models/Participation');
const User = require('../models/User');
const Team = require('../models/Team');
const { evaluateBadges } = require('../services/badgeService');
const { sendInAppNotification } = require('../services/notificationService');

// Helper to recalculate performance score
const recalculateScore = async (athleteId) => {
  const athlete = await User.findById(athleteId);
  if (!athlete) return;
  const participations = await Participation.find({ athlete: athleteId }).sort({ createdAt: -1 });
  if (participations.length === 0) return;

  const totalMatches = participations.length;
  const wins = participations.filter(p => p.result === 'Win').length;
  const winRate = wins / totalMatches;
  const participationFreq = Math.min(totalMatches / 20, 1);
  const consistency = participationFreq > 0.5 ? 0.8 : 0.4;
  
  const recent = participations.slice(0, 5);
  const recentWins = recent.filter(p => p.result === 'Win').length;
  const recentForm = recent.length > 0 ? recentWins / recent.length : 0;
  
  const performanceScore = (0.35 * winRate) + (0.25 * participationFreq) + (0.20 * consistency) + (0.20 * recentForm);
  
  athlete.performanceScore = parseFloat(performanceScore.toFixed(2));
  await athlete.save();
};

exports.getEvents = async (req, res) => {
  try {
    const query = {};
    if (req.user.role === 'Athlete') {
      query.verificationStatus = 'Approved';
    } else if (req.user.role === 'Organizer' && req.query.organizerId) {
      query.organizer = req.query.organizerId;
    }
    // Admins see all events without filters
    
    const events = await Event.find(query).populate('organizer', 'name').sort({ date: 1 }).lean();

    for (let ev of events) {
      if (ev.participationType === 'Team') {
        const teams = await Participation.distinct('team', { event: ev._id, team: { $ne: null } });
        ev.registeredCount = teams.length;
      } else {
        const count = await Participation.countDocuments({ event: ev._id });
        ev.registeredCount = count;
      }
      ev.isFull = !!(ev.maxParticipants && ev.registeredCount >= ev.maxParticipants);
    }
    
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const { title, sport, date, time, location, maxParticipants, eligibility, description, participationType } = req.body;
    const event = await Event.create({
      title, sport, date, time, location, maxParticipants, eligibility, description, participationType, organizer: req.user._id
    });

    // Notify matching athletes
    if (event.verificationStatus === 'Approved') {
      const athletes = await User.find({ role: 'Athlete', interestedSports: sport });
      for (const athlete of athletes) {
        await sendInAppNotification({
          userId: athlete._id,
          title: 'New Event Added',
          message: `A new ${sport} event "${title}" has been scheduled for ${new Date(date).toLocaleDateString()}. Check it out!`,
          type: 'event',
          referenceId: event._id,
          referenceModel: 'Event',
          sendEmail: true
        });
      }
    }

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (event.status === 'Completed') {
      return res.status(400).json({ message: 'Cannot modify a completed event' });
    }

    const updatedEvent = await Event.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    res.json(updatedEvent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await Event.findByIdAndDelete(req.params.id);
    // History is preserved; we do not delete Participation or Performance records.
    res.json({ message: 'Event removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.participateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    
    if (event.status === 'Completed') {
      return res.status(400).json({ message: 'Cannot register for a completed event' });
    }
    
    if (event.participationType === 'Team') {
      const { teamId } = req.body;
      if (!teamId) return res.status(400).json({ message: 'Team ID is required for team events' });
      
      const team = await Team.findById(teamId);
      if (!team) return res.status(404).json({ message: 'Team not found' });
      
      if (!team.players.includes(req.user._id)) {
        return res.status(403).json({ message: 'You must be a member of the team to register it' });
      }

      // Check Sport Match
      if (team.sport.toLowerCase() !== event.sport.toLowerCase()) {
        return res.status(400).json({ message: `This tournament is specifically for ${event.sport} teams.` });
      }

      // Check Min/Max Players based on sport rules
      const limits = {
        'football': { min: 11, max: 16 },
        'cricket': { min: 11, max: 15 },
        'badminton': { min: 1, max: 2 },
        'mma': { min: 1, max: 1 },
        'boxing': { min: 1, max: 1 }
      };
      const rule = limits[event.sport.toLowerCase()];
      if (rule) {
        if (team.players.length < rule.min) {
          return res.status(400).json({ message: `Your team needs at least ${rule.min} players to register for ${event.sport}. Current size: ${team.players.length}.` });
        }
        if (team.players.length > rule.max) {
          return res.status(400).json({ message: `Your team exceeds the limit of ${rule.max} players for ${event.sport}. Current size: ${team.players.length}.` });
        }
      }

      // Check Event Capacity
      const registeredTeams = await Participation.distinct('team', { event: event._id, team: { $ne: null } });
      if (event.maxParticipants && registeredTeams.length >= event.maxParticipants) {
        return res.status(400).json({ message: 'Tournament Full: The maximum number of teams has already been reached.' });
      }
      
      const participations = [];
      let alreadyRegisteredCount = 0;
      
      for (let playerId of team.players) {
        const existing = await Participation.findOne({ event: req.params.id, athlete: playerId });
        if (existing) {
          alreadyRegisteredCount++;
        } else {
          participations.push({ event: req.params.id, athlete: playerId, team: teamId });
        }
      }
      
      if (participations.length === 0) {
        return res.status(400).json({ message: 'All members of this team are already registered' });
      }
      
      await Participation.insertMany(participations);
      return res.status(201).json({ message: `Team registered. Added ${participations.length} players.` });
      
    } else {
      // Check Event Capacity for individuals
      const registeredIndividuals = await Participation.countDocuments({ event: event._id });
      if (event.maxParticipants && registeredIndividuals >= event.maxParticipants) {
        return res.status(400).json({ message: 'Tournament Full: The maximum number of participants has already been reached.' });
      }

      const existing = await Participation.findOne({ event: req.params.id, athlete: req.user._id });
      if (existing) return res.status(400).json({ message: 'Already registered' });
      
      const participation = await Participation.create({ event: req.params.id, athlete: req.user._id });
      res.status(201).json(participation);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getEventParticipants = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const participants = await Participation.find({ event: req.params.id }).populate('athlete', 'name email age interestedSports experience performanceScore').populate('team', 'name');
    res.json(participants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateParticipantStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const participation = await Participation.findById(req.params.participationId);
    if (!participation) return res.status(404).json({ message: 'Participation not found' });

    const event = await Event.findById(participation.event);
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (event.status === 'Completed') {
      return res.status(400).json({ message: 'Cannot modify participants of a completed event' });
    }

    participation.status = status;
    await participation.save();
    res.json(participation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.removeParticipant = async (req, res) => {
  try {
    const participation = await Participation.findById(req.params.participationId);
    if (!participation) return res.status(404).json({ message: 'Participation not found' });

    const event = await Event.findById(participation.event);
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (event.status === 'Completed') {
      return res.status(400).json({ message: 'Cannot modify participants of a completed event' });
    }

    await Participation.findByIdAndDelete(req.params.participationId);
    res.json({ message: 'Participant removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateResults = async (req, res) => {
  try {
    const { athleteId, result, rank } = req.body;
    const event = await Event.findById(req.params.id);
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (event.status !== 'Completed') {
      return res.status(400).json({ message: 'Results can only be updated after the event is completed' });
    }

    const participation = await Participation.findOne({ athlete: athleteId, event: req.params.id });
    if (!participation) return res.status(404).json({ message: 'Participation not found' });
    
    participation.result = result;
    if (rank) participation.rank = rank;
    await participation.save();
    
    // Auto calculate performance
    await recalculateScore(athleteId);
    await evaluateBadges(athleteId);
    
    res.json(participation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOrganizerStats = async (req, res) => {
  try {
    const query = req.user.role === 'Admin' ? {} : { organizer: req.user._id };
    const events = await Event.find(query);
    const eventIds = events.map(e => e._id);
    const participantsCount = await Participation.countDocuments({ event: { $in: eventIds } });
    
    res.json({
      totalEvents: events.length,
      upcomingEvents: events.filter(e => e.status === 'Upcoming').length,
      completedEvents: events.filter(e => e.status === 'Completed').length,
      totalParticipants: participantsCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
