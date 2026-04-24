const express = require('express');
const router = express.Router();
const { createTeam, getTeams, getAllTeams, requestToJoin, approveRequest, rejectRequest, removePlayer, deleteTeam } = require('../controllers/teamController');
const { protect } = require('../middleware/auth');

router.get('/all', protect, getAllTeams);
router.get('/', protect, getTeams);
router.post('/', protect, createTeam);

router.post('/:id/request', protect, requestToJoin);
router.post('/:id/approve', protect, approveRequest);
router.post('/:id/reject', protect, rejectRequest);

router.delete('/:id/players/:userId', protect, removePlayer);
router.delete('/:id', protect, deleteTeam);

module.exports = router;
