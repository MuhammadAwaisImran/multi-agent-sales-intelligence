const BaseAgent = require('./BaseAgent');

const schema = {
    type: "object",
    properties: {
        matched_problems: { type: "array", items: { type: "string" } },
        recommended_solution: { type: "string" },
        expected_benefits: { type: "array", items: { type: "string" } },
        impact_score: { type: "number", minimum: 0, maximum: 100 },
        pitch_angle: { type: "string" },
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
    required: ["matched_problems", "recommended_solution", "expected_benefits", "impact_score", "pitch_angle", "explainability"]
};

const systemPrompt = `You are a Strategic Solution Mapper.
Your job is to match the User's Service Offering to the specific business gaps and problems identified by the Business Analyst.
Rank the opportunities, formulate a strong pitch angle, and estimate the impact of the solution (0-100).
Return ONLY valid JSON matching the exact schema provided. Do NOT include markdown formatting outside the JSON object.`;

// Solution Mapper: Bridges the gap between the prospect's pain points and your service offering.
class SolutionMapper extends BaseAgent {
    constructor() {
        super('SolutionMapper', systemPrompt, schema);
    }

    async run(analysisData, serviceOffering, logCallback) {
        logCallback({ type: 'THOUGHT', agent: this.name, message: `Mapping service offering to identified business gaps...` });

        const userPrompt = `
--- BUSINESS ANALYSIS DATA ---
${JSON.stringify(analysisData, null, 2)}

--- USER SERVICE OFFERING ---
${serviceOffering}

Map the service offering to the problems identified in the analysis data. Generate the JSON output.
`;

        return await this.execute(userPrompt, logCallback);
    }
}

module.exports = new SolutionMapper();
