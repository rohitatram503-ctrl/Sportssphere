const cron = require('node-cron');
const Event = require('../models/Event');
const Participation = require('../models/Participation');
const Opportunity = require('../models/Opportunity');
const User = require('../models/User');
const { sendInAppNotification } = require('../services/notificationService');

const checkEventReminders = async () => {
  console.log('[Cron] Checking for Event Reminders...');
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch upcoming events that are approved
    const upcomingEvents = await Event.find({
      status: 'Upcoming',
      verificationStatus: 'Approved',
      date: { $gte: today }
    });

    for (const event of upcomingEvents) {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      
      const diffTime = eventDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let reminderMessage = '';
      let reminderTitle = '';

      if (diffDays === 2) {
        reminderTitle = `Upcoming Event: 2 Days Left`;
        reminderMessage = `Reminder: "${event.title}" is happening in 2 days. Make sure you're ready!`;
      } else if (diffDays === 1) {
        reminderTitle = `Upcoming Event: 1 Day Left`;
        reminderMessage = `Reminder: "${event.title}" is happening tomorrow! Get your gear ready.`;
      } else if (diffDays === 0) {
        reminderTitle = `Event Today!`;
        reminderMessage = `Today is the day! "${event.title}" is happening today. Good luck!`;
      }

      if (reminderTitle) {
        // Find all approved participants
        const participations = await Participation.find({ event: event._id, status: 'Approved' }).populate('athlete', '_id email');
        
        for (const p of participations) {
          if (p.athlete) {
            await sendInAppNotification({
              userId: p.athlete._id,
              title: reminderTitle,
              message: reminderMessage,
              type: 'reminder',
              referenceId: event._id,
              referenceModel: 'Event',
              sendEmail: true // Email them as well
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('[Cron Error] Event Reminders:', error);
  }
};

const checkNewOpportunities = async () => {
  console.log('[Cron] Checking for New Opportunities...');
  try {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const newOpportunities = await Opportunity.find({
      createdAt: { $gte: yesterday },
      status: { $in: ['Active', 'Verified'] }
    });

    if (newOpportunities.length === 0) return;

    const athletes = await User.find({ role: 'Athlete' });

    for (const athlete of athletes) {
      // Find matching opportunities for this athlete
      const matching = newOpportunities.filter(opp => {
        const sportMatch = opp.sport === 'Various' || (athlete.interestedSports && athlete.interestedSports.includes(opp.sport));
        const ageMatch = (opp.targetAgeMin <= (athlete.age || 100)) && (opp.targetAgeMax >= (athlete.age || 0));
        const scoreMatch = opp.minScore <= (athlete.performanceScore || 0);
        return sportMatch && ageMatch && scoreMatch;
      });

      if (matching.length > 0) {
        // Send a digest notification if there are multiple, or a specific one if single
        if (matching.length === 1) {
          const opp = matching[0];
          await sendInAppNotification({
            userId: athlete._id,
            title: 'New Opportunity Match',
            message: `A new opportunity "${opp.title}" matches your profile!`,
            type: 'opportunity',
            referenceId: opp._id,
            referenceModel: 'Opportunity',
            sendEmail: true
          });
        } else {
          await sendInAppNotification({
            userId: athlete._id,
            title: 'Multiple New Opportunities',
            message: `We found ${matching.length} new opportunities matching your profile today. Check them out!`,
            type: 'opportunity',
            sendEmail: true
          });
        }
      }
    }
  } catch (error) {
    console.error('[Cron Error] Opportunity Check:', error);
  }
};

const startNotificationJobs = () => {
  // Run Event Reminders at 9:00 AM and 6:00 PM every day
  cron.schedule('0 9,18 * * *', () => {
    checkEventReminders();
  });
  
  // Run New Opportunity matching once daily at 10:00 AM
  cron.schedule('0 10 * * *', () => {
    checkNewOpportunities();
  });

  console.log('[Cron] Notification Jobs scheduled.');
};

module.exports = startNotificationJobs;
