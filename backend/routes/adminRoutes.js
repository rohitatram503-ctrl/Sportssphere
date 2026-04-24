const express = require('express');
const router = express.Router();
const {
  getUsers, updateUserRole, updateUserStatus, deleteUser,
  updateEventVerification,
  getOpportunities, createOpportunity, updateOpportunity, deleteOpportunity, fetchOpportunities,
  getSystemStats
} = require('../controllers/adminController');
const { protect, authorizeRoles } = require('../middleware/auth');

// Apply admin protection to all routes
router.use(protect, authorizeRoles('Admin'));

// Users
router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);

// Events
router.put('/events/:id/verify', updateEventVerification);

// Opportunities
router.get('/opportunities', getOpportunities);
router.post('/opportunities', createOpportunity);
router.post('/opportunities/fetch', fetchOpportunities);
router.put('/opportunities/:id', updateOpportunity);
router.delete('/opportunities/:id', deleteOpportunity);

// Stats
router.get('/stats', getSystemStats);

module.exports = router;
