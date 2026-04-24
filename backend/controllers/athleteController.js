const User = require('../models/User');
const Participation = require('../models/Participation');
const Opportunity = require('../models/Opportunity');
const Performance = require('../models/Performance');
const { evaluateBadges } = require('../services/badgeService');

// @desc    Get athlete profile
// @route   GET /api/athletes/:id
exports.getAthlete = async (req, res) => {
  try {
    const athlete = await User.findById(req.params.id).select('-password');
    if (!athlete || athlete.role !== 'Athlete') {
      return res.status(404).json({ message: 'Athlete not found' });
    }
    res.json(athlete);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all athletes
// @route   GET /api/athletes
exports.getAllAthletes = async (req, res) => {
  try {
    const athletes = await User.find({ role: 'Athlete' }).select('name email age interestedSports experience performanceScore');
    res.json(athletes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update athlete profile
// @route   PUT /api/athletes/:id
exports.updateAthlete = async (req, res) => {
  try {
    const { name, age, interestedSports, experience } = req.body;
    const athlete = await User.findById(req.params.id);
    
    if (!athlete || athlete.role !== 'Athlete') {
      return res.status(404).json({ message: 'Athlete not found' });
    }
    
    athlete.name = name || athlete.name;
    athlete.age = age || athlete.age;
    athlete.experience = experience || athlete.experience;

    if (interestedSports) {
      if (typeof interestedSports === 'string') {
        athlete.interestedSports = interestedSports.split(',').map(s => s.trim()).filter(s => s);
      } else if (Array.isArray(interestedSports)) {
        athlete.interestedSports = interestedSports;
      }
    }
    
    const updatedAthlete = await athlete.save();
    res.json(updatedAthlete);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get athlete score
// @route   GET /api/athletes/:id/score
exports.getScore = async (req, res) => {
  try {
    const athlete = await User.findById(req.params.id);
    if (!athlete) return res.status(404).json({ message: 'Athlete not found' });

    // Calculate score
    // PerformanceScore = (0.35 * WinRate) + (0.25 * ParticipationFreq) + (0.20 * Consistency) + (0.20 * RecentForm)
    const participations = await Participation.find({ athlete: req.params.id }).sort({ createdAt: -1 });
    
    if (participations.length === 0) {
      return res.json({ score: 0 });
    }

    const totalMatches = participations.length;
    const wins = participations.filter(p => p.result === 'Win').length;
    const winRate = wins / totalMatches;
    
    // Normalize participation freq (max 20 considered 1)
    const participationFreq = Math.min(totalMatches / 20, 1);
    
    // Consistency (time gaps simply modelled as 1 for now if frequent, >0)
    const consistency = participationFreq > 0.5 ? 0.8 : 0.4;
    
    // Recent form (last 5 events)
    const recent = participations.slice(0, 5);
    const recentWins = recent.filter(p => p.result === 'Win').length;
    const recentForm = recent.length > 0 ? recentWins / recent.length : 0;
    
    const performanceScore = (0.35 * winRate) + (0.25 * participationFreq) + (0.20 * consistency) + (0.20 * recentForm);
    
    athlete.performanceScore = parseFloat(performanceScore.toFixed(2));
    await athlete.save();
    
    res.json({ score: athlete.performanceScore });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get athlete recommendations
// @route   GET /api/athletes/:id/recommendations
exports.getRecommendations = async (req, res) => {
  try {
    const athlete = await User.findById(req.params.id);
    if (!athlete) return res.status(404).json({ message: 'Athlete not found' });

    const opportunities = await Opportunity.find({
      $or: [{ sport: { $in: athlete.interestedSports } }, { sport: 'Various' }],
      minScore: { $lte: athlete.performanceScore },
      targetAgeMin: { $lte: athlete.age || 100 },
      targetAgeMax: { $gte: athlete.age || 0 },
      status: { $in: ['Active', 'Verified'] }
    }).sort({ createdAt: -1, minScore: -1 }); // Rank by latest first, then minScore
    res.json(opportunities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update or Add athlete performance
// @route   POST /api/athletes/:id/performance
exports.updatePerformance = async (req, res) => {
  try {
    const { sport, role, performanceData, eventId } = req.body;
    const athleteId = req.params.id;
    
    if (!eventId) {
      return res.status(400).json({ message: 'Event ID is required' });
    }

    const athlete = await User.findById(athleteId);
    if (!athlete || athlete.role !== 'Athlete') {
      return res.status(404).json({ message: 'Athlete not found' });
    }

    const Event = require('../models/Event');
    const event = await Event.findById(eventId);
    if (!event || event.status !== 'Completed') {
      return res.status(400).json({ message: 'Performance can only be updated for completed events' });
    }

    let calculatedScore = 0;
    
    if (sport === 'Football') {
      if (role === 'Forward') {
        const { goalsScored = 0, assists = 0, shotsOnTarget = 0, dribblesCompleted = 0 } = performanceData;
        calculatedScore = (Number(goalsScored) * 5) + (Number(assists) * 3) + (Number(shotsOnTarget) * 1) + (Number(dribblesCompleted) * 0.5);
      } else if (role === 'Midfielder') {
        const { assists = 0, passAccuracy = 0, keyPasses = 0, ballPossession = 0 } = performanceData;
        calculatedScore = (Number(assists) * 4) + (Number(passAccuracy) * 0.1) + (Number(keyPasses) * 2) + (Number(ballPossession) * 0.2);
      } else if (role === 'Defender') {
        const { tackles = 0, interceptions = 0, clearances = 0, blocks = 0 } = performanceData;
        calculatedScore = (Number(tackles) * 3) + (Number(interceptions) * 3) + (Number(clearances) * 1) + (Number(blocks) * 2);
      } else if (role === 'Goalkeeper') {
        const { saves = 0, cleanSheets = 0, goalsConceded = 0, savePercentage = 0 } = performanceData;
        calculatedScore = (Number(saves) * 2) + (Number(cleanSheets) * 10) - (Number(goalsConceded) * 2) + (Number(savePercentage) * 0.2);
      }
    } else if (sport === 'Cricket') {
      if (role === 'Batsman') {
        const { runsScored = 0, battingAverage = 0, strikeRate = 0, boundaries = 0, matchesPlayed = 0 } = performanceData;
        calculatedScore = (Number(runsScored) * 0.5) + (Number(battingAverage) * 1) + (Number(strikeRate) * 0.2) + (Number(boundaries) * 1);
      } else if (role === 'Bowler') {
        const { wicketsTaken = 0, economyRate = 0, oversBowled = 0, bowlingAverage = 0, maidenOvers = 0 } = performanceData;
        calculatedScore = (Number(wicketsTaken) * 10) - (Number(economyRate) * 2) + (Number(maidenOvers) * 5);
      } else if (role === 'All-Rounder') {
        const { runsScored = 0, strikeRate = 0, wicketsTaken = 0, economyRate = 0 } = performanceData;
        calculatedScore = (Number(runsScored) * 0.4) + (Number(strikeRate) * 0.2) + (Number(wicketsTaken) * 8) - (Number(economyRate) * 2);
      }
    } else if (sport === 'Badminton') {
      const { matchesWon = 0, smashAccuracy = 0, successfulReturns = 0, staminaScore = 0 } = performanceData;
      calculatedScore = (Number(matchesWon) * 10) + (Number(smashAccuracy) * 0.5) + (Number(successfulReturns) * 0.5) + (Number(staminaScore) * 0.2);
    } else if (sport === 'MMA' || sport === 'Wrestling') {
      const { strikesLanded = 0, takedowns = 0, submissionAttempts = 0, wins = 0, losses = 0 } = performanceData;
      calculatedScore = (Number(strikesLanded) * 0.5) + (Number(takedowns) * 3) + (Number(submissionAttempts) * 5) + (Number(wins) * 10) - (Number(losses) * 5);
    } else if (sport === 'Boxing') {
      const { punchAccuracy = 0, knockouts = 0, defenseRating = 0, roundsPlayed = 0 } = performanceData;
      calculatedScore = (Number(punchAccuracy) * 0.5) + (Number(knockouts) * 10) + (Number(defenseRating) * 0.5) + (Number(roundsPlayed) * 1);
    }

    // Apply Rank Bonus
    const participation = await Participation.findOne({ event: eventId, athlete: athleteId });
    if (participation && participation.rank) {
      if (participation.rank === 1) calculatedScore += 20;
      else if (participation.rank === 2) calculatedScore += 10;
      else if (participation.rank === 3) calculatedScore += 5;
      else if (participation.rank <= 10) calculatedScore += 2;
    }

    const normalizedNewScore = Math.max(0, Math.min(1.0, calculatedScore / 100));
    athlete.performanceScore = Math.min(1.0, athlete.performanceScore + (normalizedNewScore * 0.5));
    await athlete.save();
    
    // Check if performance already exists for this athlete and event
    let performanceRecord = await Performance.findOne({ athleteId, eventId });
    if (performanceRecord) {
      // Update existing record
      performanceRecord.sport = sport;
      performanceRecord.role = role;
      performanceRecord.performanceData = performanceData;
      performanceRecord.performanceScore = calculatedScore;
      await performanceRecord.save();
    } else {
      // Create new record
      performanceRecord = await Performance.create({
        athleteId,
        eventId,
        sport,
        role,
        performanceData,
        performanceScore: calculatedScore
      });
    }
    
    // Evaluate and award badges
    await evaluateBadges(athleteId);
    
    res.json({ message: 'Performance updated successfully', score: athlete.performanceScore, performanceRecord });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get athlete's participations
// @route   GET /api/athletes/:id/participations
exports.getAthleteParticipations = async (req, res) => {
  try {
    const participations = await Participation.find({ athlete: req.params.id })
      .populate('event', 'title sport date location status')
      .populate('team', 'name')
      .sort({ createdAt: -1 });
    res.json(participations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get athlete's performances
// @route   GET /api/athletes/:id/performances
exports.getAthletePerformances = async (req, res) => {
  try {
    const query = { athleteId: req.params.id };
    if (req.query.eventId) query.eventId = req.query.eventId;
    
    const performances = await Performance.find(query).populate('eventId', 'title date');
    res.json(performances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get athlete insights
// @route   GET /api/athletes/:id/insights
exports.getAthleteInsights = async (req, res) => {
  try {
    const athlete = await User.findById(req.params.id);
    if (!athlete) return res.status(404).json({ message: 'Athlete not found' });

    const participations = await Participation.find({ athlete: req.params.id }).sort({ createdAt: -1 });
    const performances = await Performance.find({ athleteId: req.params.id }).sort({ createdAt: -1 });

    // Evaluate badges just in case
    await evaluateBadges(req.params.id);
    
    // Fetch refreshed athlete to get latest badges
    const refreshedAthlete = await User.findById(req.params.id);

    let overallScore = Math.round((refreshedAthlete.performanceScore || 0) * 100);
    let level = 'Beginner';
    if (overallScore >= 90) level = 'Elite';
    else if (overallScore >= 75) level = 'Advanced';
    else if (overallScore >= 50) level = 'Intermediate';

    const sportScores = {};
    const sportCounts = {};
    const strengths = new Set();
    const topStats = {};

    performances.forEach(p => {
      const sport = p.sport;
      if (!sportScores[sport]) { sportScores[sport] = 0; sportCounts[sport] = 0; }
      sportScores[sport] += p.performanceScore || 0;
      sportCounts[sport] += 1;

      if (p.performanceData) {
        // Dynamically aggregate all stats by sport
        if (!topStats[sport]) topStats[sport] = {};
        
        for (const [key, value] of Object.entries(p.performanceData)) {
          const numValue = Number(value);
          if (!isNaN(numValue)) {
            // Capitalize and format key for display
            const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
            if (!topStats[sport][formattedKey]) topStats[sport][formattedKey] = 0;
            topStats[sport][formattedKey] += numValue;
          }
        }

        // Add specific strengths based on aggregated performance data
        if (sport === 'Football' || sport === 'Soccer') {
          if (p.performanceData.cleanSheets > 0) strengths.add('Solid Defender');
        }
      }
    });

    for (const sport in sportScores) {
      sportScores[sport] = Math.round(sportScores[sport] / sportCounts[sport]);
      sportScores[sport] = Math.min(100, sportScores[sport]);
    }

    // Assign strengths based on dynamic topStats
    let totalGoalsScored = 0, totalAssists = 0, totalRunsScored = 0, totalWicketsTaken = 0, totalTakedowns = 0, totalWins = 0, totalKnockouts = 0;
    
    Object.values(topStats).forEach(sportStats => {
      totalGoalsScored += sportStats['Goals Scored'] || 0;
      totalAssists += sportStats['Assists'] || 0;
      totalRunsScored += sportStats['Runs Scored'] || 0;
      totalWicketsTaken += sportStats['Wickets Taken'] || 0;
      totalTakedowns += sportStats['Takedowns'] || 0;
      totalWins += sportStats['Wins'] || 0;
      totalKnockouts += sportStats['Knockouts'] || 0;
      
      // Let's remove things that shouldn't be summed from each sport
      delete sportStats['Batting Average'];
      delete sportStats['Bowling Average'];
      delete sportStats['Strike Rate'];
      delete sportStats['Economy Rate'];
      delete sportStats['Pass Accuracy'];
      delete sportStats['Save Percentage'];
      delete sportStats['Smash Accuracy'];
      delete sportStats['Reaction Time'];
    });

    if (totalGoalsScored >= 5) strengths.add('Strong Finisher');
    if (totalAssists >= 5) strengths.add('Playmaker');
    if (totalRunsScored >= 200) strengths.add('Consistent Batsman');
    if (totalWicketsTaken >= 10) strengths.add('Wicket Taker');
    if (totalTakedowns >= 5) strengths.add('Grappling Specialist');
    if (totalWins >= 3) strengths.add('Proven Winner');
    if (totalKnockouts >= 2) strengths.add('Heavy Hitter');
    if (overallScore >= 75) strengths.add('Consistent Performer');

    const trend = performances.slice(0, 5).reverse().map(p => Math.min(100, Math.round(p.performanceScore || 0)));
    let trendStatus = 'Stable';
    if (trend.length > 1) {
      if (trend[trend.length - 1] > trend[0]) trendStatus = 'Improving';
      else if (trend[trend.length - 1] < trend[0]) trendStatus = 'Declining';
    }

    const totalEvents = participations.length;
    const wins = participations.filter(p => p.result === 'Win').length;
    const winRate = totalEvents > 0 ? Math.round((wins / totalEvents) * 100) : 0;

    res.json({
      overallScore,
      level,
      sportScores,
      trend,
      trendStatus,
      strengths: Array.from(strengths),
      topStats,
      experience: { totalEvents, winRate },
      badges: refreshedAthlete.badges || []
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
