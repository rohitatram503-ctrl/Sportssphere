const Team = require('../models/Team');
const User = require('../models/User');

exports.createTeam = async (req, res) => {
  try {
    const { name, sport, players } = req.body;
    // ensure the creator is part of the team
    const playerSet = new Set(players || []);
    playerSet.add(req.user._id.toString());
    const teamPlayers = Array.from(playerSet);
    
    let maxPlayers = 10;
    // Limits include typical substitute benches
    const limits = { 
      'Football': 16, 'Soccer': 16, 
      'Cricket': 15, 
      'Basketball': 12, 
      'Volleyball': 12,
      'Badminton': 4, 'Tennis': 4,
      'MMA': 1, 'Boxing': 1, 'Wrestling': 1 
    };
    
    // Check case insensitive
    const sportKey = Object.keys(limits).find(k => k.toLowerCase() === sport.toLowerCase());
    if (sportKey) maxPlayers = limits[sportKey];

    if (teamPlayers.length > maxPlayers) {
      return res.status(400).json({ message: `Cannot create team. Maximum allowed players for ${sport} is ${maxPlayers}.` });
    }
    
    const team = await Team.create({ 
      name, 
      sport, 
      maxPlayers,
      players: teamPlayers, 
      captain: req.user._id 
    });
    res.status(201).json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTeams = async (req, res) => {
  try {
    const query = {};
    // If athlete, get their teams. If organizer/admin, get all teams or filter as needed.
    if (req.user.role === 'Athlete') {
      query.players = req.user._id;
    }
    const teams = await Team.find(query)
      .populate('players', 'name email age interestedSports experience performanceScore')
      .populate('captain', 'name email age interestedSports experience performanceScore')
      .populate('joinRequests', 'name email age interestedSports experience performanceScore');
    res.json(teams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllTeams = async (req, res) => {
  try {
    const teams = await Team.find()
      .populate('players', 'name email age interestedSports experience performanceScore')
      .populate('captain', 'name email age interestedSports experience performanceScore')
      .populate('joinRequests', 'name email age interestedSports experience performanceScore');
    res.json(teams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.requestToJoin = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });
    if (team.players.includes(req.user._id)) return res.status(400).json({ message: 'Already a member' });
    if (team.joinRequests.includes(req.user._id)) return res.status(400).json({ message: 'Request already sent' });
    
    team.joinRequests.push(req.user._id);
    await team.save();
    res.json({ message: 'Join request sent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.approveRequest = async (req, res) => {
  try {
    const { userId } = req.body;
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });
    if (team.captain.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Only the captain can approve requests' });
    
    if (team.players.length >= team.maxPlayers) {
      return res.status(400).json({ message: 'Team has reached its maximum capacity.' });
    }
    
    team.joinRequests = team.joinRequests.filter(id => id.toString() !== userId.toString());
    if (!team.players.includes(userId)) {
      team.players.push(userId);
    }
    await team.save();
    res.json({ message: 'Request approved' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.rejectRequest = async (req, res) => {
  try {
    const { userId } = req.body;
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });
    if (team.captain.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Only the captain can reject requests' });
    
    team.joinRequests = team.joinRequests.filter(id => id.toString() !== userId.toString());
    await team.save();
    res.json({ message: 'Request rejected' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.removePlayer = async (req, res) => {
  try {
    const { userId } = req.params;
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });
    if (team.captain.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Only the captain can remove players' });
    if (team.captain.toString() === userId.toString()) return res.status(400).json({ message: 'Captain cannot be removed. Delete the team instead.' });
    
    team.players = team.players.filter(id => id.toString() !== userId.toString());
    await team.save();
    res.json({ message: 'Player removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });
    if (team.captain.toString() !== req.user._id.toString() && req.user.role !== 'Admin') return res.status(403).json({ message: 'Not authorized' });
    
    await Team.findByIdAndDelete(req.params.id);
    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
