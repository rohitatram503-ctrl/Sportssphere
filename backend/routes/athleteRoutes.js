const express = require('express');
const router = express.Router();
const { getAthlete, updateAthlete, getScore, getRecommendations, updatePerformance, getAllAthletes, getAthletePerformances, getAthleteParticipations, getAthleteInsights } = require('../controllers/athleteController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.get('/', protect, authorizeRoles('Organizer', 'Admin'), getAllAthletes);
router.get('/:id', protect, getAthlete);
router.put('/:id', protect, updateAthlete);
router.get('/:id/score', protect, getScore);
router.get('/:id/recommendations', protect, getRecommendations);
router.get('/:id/performances', protect, getAthletePerformances);
router.get('/:id/participations', protect, getAthleteParticipations);
router.get('/:id/insights', protect, getAthleteInsights);
router.post('/:id/performance', protect, authorizeRoles('Organizer'), updatePerformance);

module.exports = router;
