const express = require('express');
const router = express.Router({ mergeParams: true }); // To access eventId from parent router if needed
const { addComment, getComments } = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/:eventId', protect, addComment);
router.get('/:eventId', getComments);

module.exports = router;
