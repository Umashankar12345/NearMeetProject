const express = require('express');
const router = express.Router();
const { generateEventDescription } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

// Route to generate an event description (requires authentication)
router.post('/generate-description', protect, generateEventDescription);

module.exports = router;
