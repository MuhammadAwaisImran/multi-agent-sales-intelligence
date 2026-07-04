const BaseAgent = require('./BaseAgent');

const schema = {
    type: "object",
    properties: {
        customer_journey: { type: "string" },
        revenue_drivers: { type: "array", items: { type: "string" } },
        retention_gaps: { type: "array", items: { type: "string" } },
        marketing_gaps: { type: "array", items: { type: "string" } },
        upsell_opportunities: { type: "array", items: { type: "string" } },
        cross_sell_opportunities: { type: "array", items: { type: "string" } },
        automation_opportunities: { type: "array", items: { type: "string" } },
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
    required: [
        "customer_journey", "revenue_drivers", "retention_gaps", 
        "marketing_gaps", "upsell_opportunities", "cross_sell_opportunities", 
        "automation_opportunities", "explainability"
    ]
};

const systemPrompt = `You are a Senior Business Analyst.
Your job is to analyze the research profile of a company and identify business opportunities, operational gaps, and revenue drivers.
Map out their typical customer journey and identify potential problems with retention, marketing, upselling, cross-selling, and automation.
Return ONLY valid JSON matching the exact schema provided. Do NOT include markdown formatting outside the JSON object.`;

// Business Analyst: Evaluates the target company's operations and identifies potential pain points.
class BusinessAnalyst extends BaseAgent {
    constructor() {
        super('BusinessAnalyst', systemPrompt, schema);
    }

    async run(researchData, logCallback) {
        logCallback({ type: 'THOUGHT', agent: this.name, message: `Analyzing business model and identifying gaps...` });

        const userPrompt = `
--- RESEARCH DATA ---
${JSON.stringify(researchData, null, 2)}

Based on the research data above, generate a detailed business analysis in the required JSON format.
`;

        return await this.execute(userPrompt, logCallback);
    }
}

module.exports = new BusinessAnalyst();
