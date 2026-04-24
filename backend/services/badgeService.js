const User = require('../models/User');
const Participation = require('../models/Participation');
const Performance = require('../models/Performance');

const BADGE_DEFINITIONS = [
  // Participation
  { id: 'part_1', name: 'First Step', category: 'Participation', description: 'Participated in your first event.', icon: '🌟', condition: (stats) => stats.totalEvents >= 1 },
  { id: 'part_5', name: 'Regular Competitor', category: 'Participation', description: 'Participated in 5 events.', icon: '🏃', condition: (stats) => stats.totalEvents >= 5 },
  { id: 'part_10', name: 'Dedicated Athlete', category: 'Participation', description: 'Participated in 10 events.', icon: '🏅', condition: (stats) => stats.totalEvents >= 10 },
  { id: 'part_25', name: 'Veteran', category: 'Participation', description: 'Participated in 25 events.', icon: '🏛️', condition: (stats) => stats.totalEvents >= 25 },
  { id: 'part_50', name: 'Hall of Famer', category: 'Participation', description: 'Participated in 50 events.', icon: '👑', condition: (stats) => stats.totalEvents >= 50 },

  // Performance (Wins)
  { id: 'win_1', name: 'First Taste of Victory', category: 'Performance', description: 'Won your first match.', icon: '🥇', condition: (stats) => stats.totalWins >= 1 },
  { id: 'win_5', name: 'Winning Streak', category: 'Performance', description: 'Secured 5 wins.', icon: '🔥', condition: (stats) => stats.totalWins >= 5 },
  { id: 'win_10', name: 'Dominator', category: 'Performance', description: 'Achieved 10 wins.', icon: '🦅', condition: (stats) => stats.totalWins >= 10 },
  { id: 'win_25', name: 'Unstoppable', category: 'Performance', description: 'Secured 25 wins.', icon: '🚀', condition: (stats) => stats.totalWins >= 25 },
  { id: 'win_50', name: 'Legendary Winner', category: 'Performance', description: 'Reached 50 wins.', icon: '⭐', condition: (stats) => stats.totalWins >= 50 },

  // Performance Score
  { id: 'score_70', name: 'Rising Star', category: 'Performance', description: 'Reached a performance score of 70.', icon: '✨', condition: (stats) => stats.overallScore >= 70 },
  { id: 'score_85', name: 'Elite Athlete', category: 'Performance', description: 'Reached a performance score of 85.', icon: '⚡', condition: (stats) => stats.overallScore >= 85 },
  { id: 'score_95', name: 'Master Class', category: 'Performance', description: 'Reached a performance score of 95.', icon: '💎', condition: (stats) => stats.overallScore >= 95 },

  // Consistency (Assuming we calculate streaks)
  { id: 'streak_3', name: 'On Fire', category: 'Consistency', description: 'Achieved a 3-match win streak.', icon: '🔥', condition: (stats) => stats.maxWinStreak >= 3 },
  { id: 'streak_5', name: 'Untouchable', category: 'Consistency', description: 'Achieved a 5-match win streak.', icon: '🌪️', condition: (stats) => stats.maxWinStreak >= 5 },

  // Football
  { id: 'fb_goal_1', name: 'First Goal', category: 'Football', description: 'Scored your first goal.', icon: '⚽', condition: (stats) => stats.football.goals >= 1 },
  { id: 'fb_goal_10', name: 'Sharpshooter', category: 'Football', description: 'Scored 10 goals.', icon: '🎯', condition: (stats) => stats.football.goals >= 10 },
  { id: 'fb_goal_25', name: 'Golden Boot', category: 'Football', description: 'Scored 25 goals.', icon: '🏆', condition: (stats) => stats.football.goals >= 25 },
  { id: 'fb_goal_50', name: 'Football Legend', category: 'Football', description: 'Scored 50 goals.', icon: '👑', condition: (stats) => stats.football.goals >= 50 },
  { id: 'fb_ast_1', name: 'Team Player', category: 'Football', description: 'Recorded your first assist.', icon: '🤝', condition: (stats) => stats.football.assists >= 1 },
  { id: 'fb_ast_10', name: 'Playmaker', category: 'Football', description: 'Recorded 10 assists.', icon: '🎩', condition: (stats) => stats.football.assists >= 10 },
  { id: 'fb_ast_25', name: 'Maestro', category: 'Football', description: 'Recorded 25 assists.', icon: '🪄', condition: (stats) => stats.football.assists >= 25 },
  { id: 'fb_cs_1', name: 'The Wall', category: 'Football', description: 'Kept a clean sheet.', icon: '🧱', condition: (stats) => stats.football.cleanSheets >= 1 },

  // Cricket
  { id: 'cr_run_50', name: 'Half Century', category: 'Cricket', description: 'Scored 50 runs.', icon: '🏏', condition: (stats) => stats.cricket.runs >= 50 },
  { id: 'cr_run_100', name: 'Century Maker', category: 'Cricket', description: 'Scored 100 runs.', icon: '💯', condition: (stats) => stats.cricket.runs >= 100 },
  { id: 'cr_run_500', name: 'Run Machine', category: 'Cricket', description: 'Scored 500 runs.', icon: '🚂', condition: (stats) => stats.cricket.runs >= 500 },
  { id: 'cr_wkt_1', name: 'First Blood', category: 'Cricket', description: 'Took your first wicket.', icon: '🎯', condition: (stats) => stats.cricket.wickets >= 1 },
  { id: 'cr_wkt_10', name: 'Strike Bowler', category: 'Cricket', description: 'Took 10 wickets.', icon: '🌪️', condition: (stats) => stats.cricket.wickets >= 10 },
  { id: 'cr_wkt_25', name: 'Wicket Wizard', category: 'Cricket', description: 'Took 25 wickets.', icon: '🧙', condition: (stats) => stats.cricket.wickets >= 25 },

  // Badminton
  { id: 'bd_win_1', name: 'Court Debut', category: 'Badminton', description: 'Won your first badminton match.', icon: '🏸', condition: (stats) => stats.badminton.matchesWon >= 1 },
  { id: 'bd_win_5', name: 'Smash Hit', category: 'Badminton', description: 'Won 5 badminton matches.', icon: '💥', condition: (stats) => stats.badminton.matchesWon >= 5 },
  { id: 'bd_win_10', name: 'Shuttle Master', category: 'Badminton', description: 'Won 10 badminton matches.', icon: '👑', condition: (stats) => stats.badminton.matchesWon >= 10 },

  // MMA / Combat
  { id: 'mma_strike_10', name: 'First Exchange', category: 'MMA', description: 'Landed 10 strikes.', icon: '🥊', condition: (stats) => stats.mma.strikes >= 10 },
  { id: 'mma_strike_100', name: 'Heavy Hands', category: 'MMA', description: 'Landed 100 strikes.', icon: '👊', condition: (stats) => stats.mma.strikes >= 100 },
  { id: 'mma_tkd_5', name: 'Wrestler', category: 'MMA', description: 'Executed 5 takedowns.', icon: '🤼', condition: (stats) => stats.mma.takedowns >= 5 },
  { id: 'mma_tkd_25', name: 'Ground Controller', category: 'MMA', description: 'Executed 25 takedowns.', icon: '🛡️', condition: (stats) => stats.mma.takedowns >= 25 },

  // Special
  { id: 'sp_mvp_1', name: 'MVP', category: 'Special', description: 'Ranked 1st in an event.', icon: '🌟', condition: (stats) => stats.topRanks >= 1 },
  { id: 'sp_mvp_5', name: 'Hall of MVP', category: 'Special', description: 'Ranked 1st in 5 events.', icon: '🐐', condition: (stats) => stats.topRanks >= 5 },
  { id: 'sp_captain', name: 'Team Leader', category: 'Special', description: 'Participated as part of a team.', icon: '🗣️', condition: (stats) => stats.teamEvents >= 1 }
];

const evaluateBadges = async (athleteId) => {
  try {
    const athlete = await User.findById(athleteId);
    if (!athlete || athlete.role !== 'Athlete') return;

    // Fetch all required data
    const participations = await Participation.find({ athlete: athleteId }).sort({ createdAt: 1 });
    const performances = await Performance.find({ athleteId }).sort({ createdAt: 1 });

    // Aggregate stats
    const stats = {
      totalEvents: participations.length,
      totalWins: participations.filter(p => p.result === 'Win').length,
      overallScore: Math.round((athlete.performanceScore || 0) * 100),
      maxWinStreak: 0,
      topRanks: participations.filter(p => p.rank === 1).length,
      teamEvents: participations.filter(p => p.team != null).length,
      football: { goals: 0, assists: 0, cleanSheets: 0 },
      cricket: { runs: 0, wickets: 0 },
      badminton: { matchesWon: 0 },
      mma: { strikes: 0, takedowns: 0 }
    };

    // Calculate max win streak
    let currentStreak = 0;
    participations.forEach(p => {
      if (p.result === 'Win') {
        currentStreak++;
        if (currentStreak > stats.maxWinStreak) stats.maxWinStreak = currentStreak;
      } else {
        currentStreak = 0;
      }
    });

    // Aggregate performance data
    performances.forEach(p => {
      const data = p.performanceData || {};
      const sport = p.sport;
      if (sport === 'Football' || sport === 'Soccer') {
        stats.football.goals += Number(data.goalsScored || 0);
        stats.football.assists += Number(data.assists || 0);
        stats.football.cleanSheets += Number(data.cleanSheets || 0);
      } else if (sport === 'Cricket') {
        stats.cricket.runs += Number(data.runsScored || 0);
        stats.cricket.wickets += Number(data.wicketsTaken || 0);
      } else if (sport === 'Badminton') {
        stats.badminton.matchesWon += Number(data.matchesWon || 0);
      } else if (sport === 'MMA' || sport === 'Wrestling') {
        stats.mma.strikes += Number(data.strikesLanded || 0);
        stats.mma.takedowns += Number(data.takedowns || 0);
      }
    });

    // Evaluate badges
    const currentBadges = athlete.badges || [];
    const unlockedBadgeNames = currentBadges.map(b => b.name);
    let newBadgesAdded = false;

    for (const badgeDef of BADGE_DEFINITIONS) {
      if (!unlockedBadgeNames.includes(badgeDef.name) && badgeDef.condition(stats)) {
        athlete.badges.push({
          name: badgeDef.name,
          category: badgeDef.category,
          description: badgeDef.description,
          icon: badgeDef.icon,
          achievedAt: new Date()
        });
        newBadgesAdded = true;
      }
    }

    if (newBadgesAdded) {
      await athlete.save();
    }
  } catch (error) {
    console.error('Badge Evaluation Error:', error);
  }
};

module.exports = {
  BADGE_DEFINITIONS,
  evaluateBadges
};
