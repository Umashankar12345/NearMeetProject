const Comment = require('../models/Comment');
const Event = require('../models/Event');
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY, 
});

exports.addComment = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ message: 'Comment text is required' });
        }

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const comment = await Comment.create({
            event: eventId,
            user: req.user.id,
            text
        });

        // Trigger Sentiment Analysis for Trending Badge
        // Fetch last 10 comments for this event to analyze overall hype
        const recentComments = await Comment.find({ event: eventId })
            .sort({ createdAt: -1 })
            .limit(10);

        if (recentComments.length >= 3) {
            const commentsText = recentComments.map(c => c.text).join(' | ');

            try {
                const msg = await anthropic.messages.create({
                    model: "claude-3-haiku-20240307",
                    max_tokens: 10,
                    temperature: 0.1,
                    system: "You are a sentiment analyzer. Read the provided comments for an event. If the overall sentiment shows extreme excitement, hype, or anticipation, output 'Hyped'. If there is positive interest and discussion, output 'Trending'. Otherwise, output 'None'. Output ONLY one of these three words.",
                    messages: [{ role: "user", content: `Comments: ${commentsText}` }]
                });

                const badge = msg.content[0].text.trim();
                
                if (['None', 'Trending', 'Hyped'].includes(badge)) {
                    event.trending_badge = badge;
                    await event.save();
                }
            } catch (aiError) {
                console.error('Sentiment Analysis failed:', aiError);
            }
        }

        res.status(201).json(comment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getComments = async (req, res) => {
    try {
        const { eventId } = req.params;
        const comments = await Comment.find({ event: eventId }).populate('user', 'name');
        res.json(comments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
