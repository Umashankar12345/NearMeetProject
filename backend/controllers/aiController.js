const Anthropic = require('@anthropic-ai/sdk');

// Initialize Claude client
// Ensure CLAUDE_API_KEY is in your .env file
const anthropic = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY, 
});

exports.generateEventDescription = async (req, res) => {
    try {
        const { title, context } = req.body;

        if (!title) {
            return res.status(400).json({ message: 'Event title is required to generate a description' });
        }

        const promptContext = context ? `Additional context: ${context}` : '';

        const msg = await anthropic.messages.create({
            model: "claude-3-haiku-20240307", // Fast and cheap for this use case
            max_tokens: 300,
            temperature: 0.7,
            system: "You are a hype-building copywriter for an event discovery app called NearMeet. Given an event title, write a short, engaging, and exciting 2-3 paragraph description that will make people want to attend. Use emojis where appropriate. Do not include introductory conversational text.",
            messages: [
                {
                    role: "user",
                    content: `Event Title: ${title}\n${promptContext}`
                }
            ]
        });

        res.json({ description: msg.content[0].text });
    } catch (error) {
        console.error('Claude API Error:', error);
        res.status(500).json({ message: 'Failed to generate description', error: error.message });
    }
};

const Event = require('../models/Event');

exports.chatAssistant = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ message: 'Message is required' });
        }

        // Fetch upcoming events to provide as context to Claude
        // In a real app with thousands of events, you'd use embeddings/vector search here.
        // For a hackathon, passing the latest 50 events is perfect and highly accurate.
        const upcomingEvents = await Event.find().limit(50).lean();
        
        const eventsContext = upcomingEvents.map(e => ({
            id: e._id.toString(),
            title: e.title,
            description: e.description,
            date: e.date_time,
            tags: e.tags
        }));

        const systemPrompt = `You are a helpful and enthusiastic event discovery assistant for the app NearMeet. 
You help users find the perfect events based on their natural language queries (like "find me a tech event this weekend").
Here is the JSON list of currently available events in our database:
${JSON.stringify(eventsContext)}

Analyze the user's request and find the best matching events. 
You MUST respond in valid JSON format ONLY, with two keys:
1. "reply": A friendly, conversational message answering the user and mentioning the events you found.
2. "recommended_event_ids": An array of the event IDs (strings) that match their request. If none match, return an empty array.

Example Response:
{
  "reply": "I found a great tech event happening this weekend called Hackathon 2026! It looks perfect for you.",
  "recommended_event_ids": ["65f1a2b..."]
}`;

        const msg = await anthropic.messages.create({
            model: "claude-3-haiku-20240307",
            max_tokens: 500,
            temperature: 0.2, // Low temperature for more reliable JSON formatting
            system: systemPrompt,
            messages: [{ role: "user", content: message }]
        });

        // Parse Claude's JSON response
        let aiResponse;
        try {
            // Find JSON block if Claude wrapped it in markdown
            const textResponse = msg.content[0].text;
            const jsonStr = textResponse.match(/\{[\s\S]*\}/)[0];
            aiResponse = JSON.parse(jsonStr);
        } catch (parseError) {
            console.error('Failed to parse Claude JSON:', parseError);
            return res.status(500).json({ message: 'AI returned malformed data', raw: msg.content[0].text });
        }

        // Populate the rich event objects for the frontend to render as cards
        const populatedEvents = await Event.find({
            _id: { $in: aiResponse.recommended_event_ids }
        }).populate('created_by', 'name email').lean();

        res.json({
            reply: aiResponse.reply,
            events: populatedEvents
        });

    } catch (error) {
        console.error('Chat Assistant Error:', error);
        res.status(500).json({ message: 'Failed to process chat request', error: error.message });
    }
};
