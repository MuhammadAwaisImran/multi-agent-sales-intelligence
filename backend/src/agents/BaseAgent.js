const llmClient = require('../core/LLMClient');

class BaseAgent {
    constructor(name, systemPrompt, schema) {
        this.name = name;
        this.systemPrompt = systemPrompt;
        this.schema = schema; // Expected JSON Schema
    }

    /**
     * Executes the agent's logic
     * @param {string} userPrompt - The context and request for the LLM
     * @param {function} logCallback - Optional callback for real-time SSE logs
     * @returns {Promise<object>} The validated JSON output
     */
    async execute(userPrompt, logCallback = () => {}) {
        logCallback({ type: 'AGENT_START', agent: this.name });
        
        try {
            // Append Schema instruction to system prompt to enforce structure
            const fullSystemPrompt = `${this.systemPrompt}\n\nYou MUST return valid JSON that exactly matches this schema:\n${JSON.stringify(this.schema, null, 2)}\nDo not wrap the JSON in markdown blocks if format: 'json' is used.`;
            
            logCallback({ type: 'THOUGHT', agent: this.name, message: `Calling LLM for ${this.name}...` });
            
            const result = await llmClient.generateJSON(fullSystemPrompt, userPrompt);
            
            logCallback({ type: 'AGENT_COMPLETE', agent: this.name });
            return result;
        } catch (error) {
            logCallback({ type: 'ERROR', agent: this.name, message: error.message });
            throw new Error(`[${this.name}] Execution failed: ${error.message}`);
        }
    }
}

module.exports = BaseAgent;
