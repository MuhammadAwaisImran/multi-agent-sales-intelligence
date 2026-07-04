const cheerio = require('cheerio');
const BrowserService = require('./BrowserService');

// Web Scraper: Gathers raw textual data from the target company's digital presence.
class WebScraper {
    constructor() {
        this.browserService = new BrowserService();
    }

    async scrape(url, logCallback = () => {}) {
        logCallback({ type: 'TOOL_USE', tool: 'WebScraper', message: `Scraping URL: ${url} using Playwright BrowserService` });
        
        try {
            // Fetch HTML using our resilient BrowserService
            // It automatically handles retries, proxies, and waits for networkidle
            const html = await this.browserService.fetchWithRetry(url, 3);
            
            const $ = cheerio.load(html);
            
            // Remove unnecessary elements to clean up text
            $('script, style, noscript, iframe, img, svg, video, audio').remove();
            
            // Extract text and compress whitespace
            const text = $('body').text().replace(/\s+/g, ' ').trim();
            
            // Truncate if too long (e.g. keep first 8000 chars for context limits)
            const truncatedText = text.length > 8000 ? text.substring(0, 8000) + '... [TRUNCATED]' : text;
            
            logCallback({ type: 'TOOL_USE', tool: 'WebScraper', message: `Successfully scraped ${url}` });
            return truncatedText;
        } catch (error) {
            logCallback({ type: 'TOOL_USE', tool: 'WebScraper', message: `Failed to scrape ${url}: ${error.reason || error.message}` });
            return `Error scraping ${url}: ${error.reason || error.message}`;
        }
    }
}

module.exports = new WebScraper();
