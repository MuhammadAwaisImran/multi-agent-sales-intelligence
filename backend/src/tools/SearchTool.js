const axios = require('axios');

const fetchWithRetry = async (url, options, maxRetries = 3) => {
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            return await axios.get(url, options);
        } catch (error) {
            attempt++;
            if (attempt >= maxRetries) {
                // Check for typical local network / VPN interference
                if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
                    throw new Error(`Connection failed (${error.code}). Please check if your VPN, proxy, or firewall is interfering with outbound traffic. Original error: ${error.message}`);
                }
                throw error;
            }
            // Exponential backoff: 1000ms, 2000ms, 4000ms...
            const delay = Math.pow(2, attempt - 1) * 1000;
            console.log(`Retry attempt ${attempt} for SearchTool after ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};

class SearchTool {
    async search(query, logCallback = () => {}) {
        logCallback({ type: 'TOOL_USE', tool: 'SearchTool', message: `Searching for: ${query}` });
        try {
            // Using Wikipedia API for a free, no-auth search for the MVP
            const response = await fetchWithRetry('https://en.wikipedia.org/w/api.php', {
                params: {
                    action: 'query',
                    list: 'search',
                    srsearch: query,
                    format: 'json',
                    utf8: 1
                },
                headers: {
                    // Wikipedia prefers a specific user-agent format. Changed from example.com to avoid 429 blocks
                    'User-Agent': 'SalesIntelligenceBot/1.2 (b2b-agent-local@dev.internal) Axios/1.x',
                    'Accept': 'application/json'
                },
                timeout: 30000 // Increased to 30,000ms
            });

            if (response.data && response.data.query && response.data.query.search) {
                const results = response.data.query.search;
                if (results.length === 0) {
                    return "No results found.";
                }
                
                // Take top 3 results and combine their snippets
                const snippets = results.slice(0, 3).map(r => {
                    // Remove HTML tags from snippet
                    const cleanSnippet = r.snippet.replace(/(<([^>]+)>)/gi, "");
                    return `Title: ${r.title}\nSnippet: ${cleanSnippet}`;
                });
                
                logCallback({ type: 'TOOL_USE', tool: 'SearchTool', message: `Found ${results.length} results.` });
                return snippets.join('\n\n');
            }
            return "No results found.";
        } catch (error) {
            logCallback({ type: 'TOOL_USE', tool: 'SearchTool', message: `Search failed: ${error.message}` });
            return `Search error: ${error.message}`;
        }
    }
}

module.exports = new SearchTool();
