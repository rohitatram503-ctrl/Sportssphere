const nodemailer = require('nodemailer');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // or any other service configured in .env
  auth: {
    user: process.env.EMAIL_USER || 'test@example.com',
    pass: process.env.EMAIL_PASS || 'password'
  }
});

/**
 * Sends an email notification
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - Email body in HTML format
 */
const sendEmailNotification = async (to, subject, html) => {
  try {
    if (!process.env.EMAIL_USER) {
      console.log(`[Email Mock] To: ${to} | Subject: ${subject}`);
      return;
    }

    await transporter.sendMail({
      from: `"SportsSphere" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
  }
};

/**
 * Sends an in-app notification and optionally an email
 * @param {Object} options
 * @param {string} options.userId - Athlete's user ID
 * @param {string} options.title - Notification title
 * @param {string} options.message - Notification message
 * @param {string} options.type - Notification type ('event', 'opportunity', 'reminder')
 * @param {string} [options.referenceId] - ID of the related event/opportunity
 * @param {string} [options.referenceModel] - 'Event' or 'Opportunity'
 * @param {boolean} [options.sendEmail=false] - Whether to also send an email
 */
const sendInAppNotification = async ({ userId, title, message, type, referenceId, referenceModel, sendEmail = false }) => {
  try {
    // Avoid duplicate identical notifications
    const existing = await Notification.findOne({
      userId,
      title,
      type,
      referenceId,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // within last 24 hrs
    });

    if (existing) {
      return; // Skip duplicate
    }

    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      referenceId,
      referenceModel
    });

    if (sendEmail) {
      const user = await User.findById(userId);
      if (user && user.email) {
        const emailHtml = `
          <h2>${title}</h2>
          <p>${message}</p>
          <br/>
          <p>Best Regards,</p>
          <p>The SportsSphere Team</p>
        `;
        await sendEmailNotification(user.email, title, emailHtml);
      }
    }

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

module.exports = {
  sendEmailNotification,
  sendInAppNotification
};
