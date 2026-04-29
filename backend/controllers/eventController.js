const Event = require('../models/Event');

exports.createEvent = async (req, res) => {
    try {
        const { title, description, latitude, longitude, date_time } = req.body;

        if (!title || !description || !latitude || !longitude || !date_time) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const event = await Event.create({
            title,
            description,
            location: {
                type: 'Point',
                coordinates: [longitude, latitude] // Note: GeoJSON expects [longitude, latitude]
            },
            date_time,
            created_by: req.user.id
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
