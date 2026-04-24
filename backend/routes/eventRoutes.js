const express = require('express');
const router = express.Router();
const { 
  getEvents, createEvent, updateEvent, deleteEvent, 
  participateEvent, getEventParticipants, updateParticipantStatus, 
  removeParticipant, updateResults, getOrganizerStats 
} = require('../controllers/eventController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.get('/organizer/stats', protect, authorizeRoles('Organizer', 'Admin'), getOrganizerStats);

router.route('/')
  .get(protect, getEvents)
  .post(protect, authorizeRoles('Organizer'), createEvent);

router.route('/:id')
  .put(protect, authorizeRoles('Organizer', 'Admin'), updateEvent)
  .delete(protect, authorizeRoles('Organizer', 'Admin'), deleteEvent);

router.post('/:id/register', protect, authorizeRoles('Athlete'), participateEvent);
router.get('/:id/participants', protect, authorizeRoles('Organizer', 'Admin'), getEventParticipants);
router.put('/participations/:participationId/status', protect, authorizeRoles('Organizer', 'Admin'), updateParticipantStatus);
router.delete('/participations/:participationId', protect, authorizeRoles('Organizer', 'Admin'), removeParticipant);
router.put('/:id/results', protect, authorizeRoles('Organizer', 'Admin'), updateResults);

module.exports = router;
