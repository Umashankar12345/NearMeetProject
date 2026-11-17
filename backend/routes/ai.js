const express = require('express');
const router = express.Router();
const { generateEventDescription, chatAssistant } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

// Route to generate an event description (requires authentication)
router.post('/generate-description', protect, generateEventDescription);

// Route for the in-app AI chat assistant (requires authentication)
router.post('/chat', protect, chatAssistant);

module.exports = router;
