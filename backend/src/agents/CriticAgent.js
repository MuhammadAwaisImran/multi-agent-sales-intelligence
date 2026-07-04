const BaseAgent = require('./BaseAgent');

const schema = {
    type: "object",
    properties: {
        personalization: { type: "number", minimum: 0, maximum: 10 },
        specificity: { type: "number", minimum: 0, maximum: 10 },
        business_insight: { type: "number", minimum: 0, maximum: 10 },
        persuasiveness: { type: "number", minimum: 0, maximum: 10 },
        clarity: { type: "number", minimum: 0, maximum: 10 },
        overall_score: { type: "number", minimum: 0, maximum: 10 },
        weaknesses: { type: "array", items: { type: "string" } },
        improvements: { type: "array", items: { type: "string" } },
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
    required: ["personalization", "specificity", "business_insight", "persuasiveness", "clarity", "overall_score", "weaknesses", "improvements", "explainability"]
};

const systemPrompt = `You are a ruthless Sales Copy Critic.
Evaluate the Pitch Writer's output out of 10 for: Personalization, Specificity, Business Insight, Persuasiveness, and Clarity.
Calculate an overall_score (average of the 5 metrics).
Identify specific weaknesses and required improvements.
Return ONLY valid JSON matching the exact schema provided. Do NOT include markdown formatting outside the JSON object.`;

// Critic Agent: Acts as a strict quality control, evaluating pitches against best practices and forcing rewrites if needed.
class CriticAgent extends BaseAgent {
    constructor() {
        super('CriticAgent', systemPrompt, schema);
    }

    async run(pitchData, mappingData, logCallback) {
        logCallback({ type: 'THOUGHT', agent: this.name, message: `Critiquing outreach assets...` });

        const userPrompt = `
--- STRATEGY MAPPING (Context) ---
${JSON.stringify(mappingData, null, 2)}

--- DRAFT PITCHES TO EVALUATE ---
${JSON.stringify(pitchData, null, 2)}

Evaluate the draft pitches based on how well they align with the strategy context and the rules. Provide your scores and feedback in JSON.
`;

        return await this.execute(userPrompt, logCallback);
    }
}

module.exports = new CriticAgent();
