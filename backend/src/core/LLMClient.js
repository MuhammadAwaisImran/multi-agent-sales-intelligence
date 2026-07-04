const axios = require('axios');

class LLMClient {
    constructor() {
        // Defaulting to local Ollama API
        this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
        this.model = process.env.OLLAMA_MODEL || 'gemma4:e2b';
    }

    /**
     * Extracts JSON from a markdown string (e.g. ```json { ... } ```)
     */
    extractJSON(text) {
        try {
            // First attempt to just parse the whole response
            return JSON.parse(text);
        } catch (e) {
            // If it fails, look for JSON code blocks
            const match = text.match(/```json\n([\s\S]*?)\n```/);
            if (match && match[1]) {
                try {
                    return JSON.parse(match[1]);
                } catch (e2) {
                    throw new Error("Failed to parse JSON inside markdown block.");
                }
            }
            // Fallback: look for generic code blocks or the first { and last }
            const start = text.indexOf('{');
            const end = text.lastIndexOf('}');
            if (start !== -1 && end !== -1) {
                try {
                    return JSON.parse(text.substring(start, end + 1));
                } catch (e3) {
                    throw new Error("Failed to parse extracted JSON substring.");
                }
            }
            throw new Error("No valid JSON found in LLM response.");
        }
    }

    async generateJSON(systemPrompt, userPrompt) {
        const payload = {
            model: this.model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            stream: false,
            // Format can be set to json for models that support it in Ollama
            format: 'json',
            options: {
                temperature: 0.2 // Lower temp for more deterministic structured output
            }
        };

        try {
            const response = await axios.post(`${this.baseUrl}/api/chat`, payload);
            if (response.data && response.data.message && response.data.message.content) {
                const text = response.data.message.content;
                return this.extractJSON(text);
            } else {
                throw new Error("Invalid response format from Ollama.");
            }
        } catch (error) {
            console.error("LLM Generation Error:", error.message);
            throw error;
        }
    }
}

module.exports = new LLMClient();
