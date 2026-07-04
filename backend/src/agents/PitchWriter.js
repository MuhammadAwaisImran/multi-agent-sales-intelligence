const BaseAgent = require('./BaseAgent');

const schema = {
    type: "object",
    properties: {
        email: { type: "string" },
        linkedin_message: { type: "string" },
        call_opener: { type: "string" },
        follow_up_email: { type: "string" },
        explainability: {
            type: "object",
            properties: {
                observation: { type: "string" },
                evidence: { type: "string" },
                recommendation: { type: "string" },
                expected_impact: { type: "string" }
            },
            required: ["observation", "evidence", "recommendation", "expected_impact"]
        }
    },
    required: ["email", "linkedin_message", "call_opener", "follow_up_email", "explainability"]
};

const systemPrompt = `You are an elite Enterprise Pitch Writer.
Your job is to use the Solution Mapper's output to draft outreach assets.

Rules:
- Be concise.
- Sound like a consultant.
- Include one specific business observation.
- Include measurable outcomes.

Forbidden phrases:
- leverage
- maximize value
- engagement loops
- loyal advocates
- transformative
- synergize
- game-changing

Return ONLY valid JSON matching the exact schema provided. Do NOT include markdown formatting outside the JSON object.`;

// Pitch Writer: Drafts highly personalized, compelling B2B email pitches based on research and mapping.
class PitchWriter extends BaseAgent {
    constructor() {
        super('PitchWriter', systemPrompt, schema);
    }

    async run(mappingData, logCallback, previousFeedback = null) {
        logCallback({ type: 'THOUGHT', agent: this.name, message: `Drafting outreach assets based on solution mapping...` });

        let feedbackSection = "";
        if (previousFeedback) {
            logCallback({ type: 'THOUGHT', agent: this.name, message: `Applying Critic feedback to improve the pitch...` });
            feedbackSection = `
--- PREVIOUS CRITIQUE FEEDBACK ---
Please rewrite the pitch incorporating the following feedback:
${JSON.stringify(previousFeedback, null, 2)}
`;
        }

        const userPrompt = `
--- STRATEGY DATA ---
${JSON.stringify(mappingData, null, 2)}

${feedbackSection}

Generate the final outreach assets in the required JSON format.
`;

        return await this.execute(userPrompt, logCallback);
    }
}

module.exports = new PitchWriter();
