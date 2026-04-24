const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Notification = require('../models/Notification');

// @desc    Get all notifications for user
// @route   GET /api/notifications
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Test email configuration
// @route   POST /api/notifications/test-email
// @access  Private
router.post('/test-email', protect, async (req, res) => {
  try {
    const { sendEmailNotification } = require('../services/notificationService');
    const testEmail = req.user.email; // Send to the logged in user

    if (!testEmail) {
      return res.status(400).json({ message: 'Your account does not have an email address set.' });
    }

    if (!process.env.EMAIL_USER) {
      return res.status(400).json({ message: 'EMAIL_USER is not configured in your .env file. Email sending is disabled.' });
    }

    const html = `
      <h2>Test Email from SportsSphere</h2>
      <p>If you are reading this, your email configuration using NodeMailer is working perfectly!</p>
      <br/>
      <p>Best Regards,</p>
      <p>The SportsSphere Team</p>
    `;

    await sendEmailNotification(testEmail, 'SportsSphere Email Test', html);
    
    res.json({ message: `Test email successfully dispatched to ${testEmail}!` });
  } catch (error) {
    res.status(500).json({ message: `Error sending email: ${error.message}` });
  }
});

// @desc    Get unread count
// @route   PUT /api/notifications/:id/read
// @access  Private
router.get('/unread-count', protect, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ userId: req.user._id, isRead: false });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Mark all as read
// @route   PUT /api/notifications/read-all
// @access  Private
router.put('/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
