const BaseAgent = require('./BaseAgent');
const webScraper = require('../tools/WebScraper');
const searchTool = require('../tools/SearchTool');

const schema = {
    type: "object",
    properties: {
        company: { type: "string" },
        industry: { type: "string" },
        business_model: { type: "string" },
        target_customers: { type: "array", items: { type: "string" } },
        products: { type: "array", items: { type: "string" } },
        services: { type: "array", items: { type: "string" } },
        positioning: { type: "string" },
        mission: { type: "string" },
        strengths: { type: "array", items: { type: "string" } },
        explainability: {
            type: "object",
            properties: {
                observation: { type: "string" },
                evidence: { type: "string" }
            },
            required: ["observation", "evidence"]
        }
    },
    required: ["company", "industry", "business_model", "target_customers", "products", "services", "positioning", "mission", "strengths", "explainability"]
};

const systemPrompt = `You are an expert Business Researcher.
Your job is to analyze the provided company context, scraped website data, and search results to build a comprehensive profile of the company.
Identify their industry, business model, target customers, core products and services, positioning, mission, and strengths.
Return ONLY valid JSON matching the provided schema. Do NOT include markdown formatting outside the JSON object.`;

// Research Agent: Distills raw scraped data into actionable intelligence. Builds a structured company profile.
class ResearchAgent extends BaseAgent {
    constructor() {
        super('ResearchAgent', systemPrompt, schema);
    }

    async run(data, logCallback) {
        logCallback({ type: 'THOUGHT', agent: this.name, message: `Starting research for ${data.companyName}...` });
        
        let websiteContent = "";
        if (data.websiteUrl) {
            websiteContent = await webScraper.scrape(data.websiteUrl, logCallback);
        }

        let searchContent = "";
        if (data.companyName) {
            searchContent = await searchTool.search(data.companyName + " company overview", logCallback);
        }

        const userPrompt = `
COMPANY NAME: ${data.companyName}
WEBSITE URL: ${data.websiteUrl}
USER CONTEXT: ${data.context || 'None provided'}

--- SCRAPED WEBSITE DATA ---
${websiteContent}

--- SEARCH RESULTS ---
${searchContent}

Analyze this information and generate the JSON profile.
`;

        return await this.execute(userPrompt, logCallback);
    }
}

module.exports = new ResearchAgent();
