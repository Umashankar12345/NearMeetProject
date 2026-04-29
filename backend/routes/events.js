const express = require('express');
const router = express.Router();
const { createEvent, getNearbyEvents, getPersonalizedFeed } = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createEvent);
router.get('/nearby', getNearbyEvents);
router.get('/feed', protect, getPersonalizedFeed);

module.exports = router;
