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
