const Event = require('../models/Event');
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY, 
});
exports.createEvent = async (req, res) => {
    try {
        const { title, description, latitude, longitude, date_time } = req.body;

        if (!title || !description || !latitude || !longitude || !date_time) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }
        // Use Claude to auto-generate tags
        let tags = [];
        try {
            const msg = await anthropic.messages.create({
                model: "claude-3-haiku-20240307",
                max_tokens: 50,
                temperature: 0.3,
                system: "You are an AI categorizer. Given an event title and description, return exactly 3 relevant tags/categories separated by commas, in lowercase (e.g., tech, music, networking). Do not return any other text.",
                messages: [{ role: "user", content: `Title: ${title}\nDescription: ${description}` }]
            });
            const textResponse = msg.content[0].text;
            tags = textResponse.split(',').map(tag => tag.trim().toLowerCase());
        } catch (aiError) {
            console.error('Failed to auto-generate tags', aiError);
        }

        const event = await Event.create({
            title,
            description,
            location: {
                type: 'Point',
                coordinates: [longitude, latitude] // Note: GeoJSON expects [longitude, latitude]
            },
            date_time,
            created_by: req.user.id,
            tags
        });

        res.status(201).json(event);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getNearbyEvents = async (req, res) => {
    try {
        const { latitude, longitude, distance = 5000 } = req.query; // default 5km

        if (!latitude || !longitude) {
            return res.status(400).json({ message: 'Please provide latitude and longitude' });
        }

        const events = await Event.find({
            location: {
                $near: {
                    $maxDistance: parseInt(distance),
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(longitude), parseFloat(latitude)]
                    }
                }
            }
        }).populate('created_by', 'name email');

        res.json(events);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getPersonalizedFeed = async (req, res) => {
    try {
        const { latitude, longitude, distance = 10000 } = req.query; 

        if (!latitude || !longitude) {
            return res.status(400).json({ message: 'Please provide latitude and longitude' });
        }

        // Find nearby events
        const events = await Event.find({
            location: {
                $near: {
                    $maxDistance: parseInt(distance),
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(longitude), parseFloat(latitude)]
                    }
                }
            }
        }).populate('created_by', 'name email').lean();

        // Basic Personalization Logic:
        // Rank events higher if they match user's category preferences
        const userPreferences = req.user.category_preferences || [];
        
        const rankedEvents = events.sort((a, b) => {
            const aMatches = a.tags ? a.tags.filter(tag => userPreferences.includes(tag)).length : 0;
            const bMatches = b.tags ? b.tags.filter(tag => userPreferences.includes(tag)).length : 0;
            
            // Sort descending by matches
            if (aMatches !== bMatches) {
                return bMatches - aMatches;
            }
            // If matches are the same, closest first (default $near behavior preserves this if not overridden)
            return 0; 
        });

        res.json(rankedEvents);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
