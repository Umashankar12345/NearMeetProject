const express = require('express');
const router = express.Router();
const { createEvent, getNearbyEvents } = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createEvent);
router.get('/nearby', getNearbyEvents);

module.exports = router;
