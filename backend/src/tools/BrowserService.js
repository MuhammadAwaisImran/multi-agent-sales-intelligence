const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();

// Apply the stealth plugin to avoid basic bot detection
chromium.use(stealth);

class BrowserService {
  constructor() {
    this.browser = null;
  }

  /**
   * Initializes the Playwright browser with stealth and proxy support.
   */
  async init() {
    if (!this.browser) {
      // Proxy support via environment variables.
      // Expected format: 'http://username:password@ip:port' or 'http://ip:port'
      const proxyUrl = process.env.PROXY_URL; 
      
      const launchOptions = {
        headless: true, // Run headless by default
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled', // Help bypass bot detection
        ]
      };

      // Set up IP rotation/proxy if configured
      if (proxyUrl) {
        launchOptions.proxy = {
          server: proxyUrl,
        };
      }

      this.browser = await chromium.launch(launchOptions);
    }
  }

  /**
   * Closes the browser instance.
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Fetches the HTML content of a URL with retry logic and dynamic loading support.
   *
   * @param {string} url - The URL to scrape.
   * @param {number} maxRetries - The maximum number of retries upon failure.
   * @param {string|null} waitForSelector - Optional CSS selector to wait for before returning HTML.
   * @returns {Promise<string>} - The rendered HTML of the page.
   */
  async fetchWithRetry(url, maxRetries = 3, waitForSelector = null) {
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        if (!this.browser) {
          await this.init();
        }

        // Create a new context mimicking a standard desktop Chrome user
        const context = await this.browser.newContext({
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          viewport: { width: 1920, height: 1080 },
          locale: 'en-US',
          timezoneId: 'America/New_York',
        });

        const page = await context.newPage();

        // Navigate to the page. We use 'domcontentloaded' instead of 'networkidle' 
        // because many e-commerce sites have continuous background requests that prevent 'networkidle'.
        const response = await page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: 30000 // 30 seconds limit for initial page load
        }).catch(e => {
          if (e.message.includes('Timeout')) {
            console.log(`[BrowserService] Goto timed out waiting, but proceeding to extract HTML anyway.`);
            return null; // Return null response but continue execution
          }
          throw e;
        });

        // Wait an additional few seconds to let client-side JS frameworks render
        await page.waitForTimeout(5000);

        // Wait for specific selector if provided to guarantee the main product content is fully rendered
        if (waitForSelector) {
          await page.waitForSelector(waitForSelector, { timeout: 15000 });
        }

        // Identify common bot-blocking response codes
        const status = response ? response.status() : null;
        if (status === 403 || status === 429) {
          throw new Error(`Bot Blocked - HTTP ${status}`);
        }

        // Grab fully rendered HTML
        const html = await page.content();
        await context.close();
        return html;

      } catch (error) {
        attempt++;
        const errorMessage = error.message;
        let failureReason = 'Unknown Error';
        
        // Categorize the error for the orchestrator
        if (errorMessage.includes('ERR_TIMED_OUT') || errorMessage.includes('Timeout') || errorMessage.includes('ETIMEDOUT')) {
          failureReason = 'Timeout';
        } else if (errorMessage.includes('ERR_ABORTED') || errorMessage.includes('aborted')) {
          failureReason = 'Aborted';
        } else if (errorMessage.includes('Bot Blocked')) {
          failureReason = 'Bot Blocked';
        } else if (errorMessage.includes('ERR_INVALID_URL') || errorMessage.includes('Invalid URL')) {
          failureReason = 'Invalid URL';
          attempt = maxRetries + 1; // Fast-fail: Do not retry on completely invalid URLs
        } else if (errorMessage.includes('net::ERR_NAME_NOT_RESOLVED')) {
          failureReason = 'DNS Resolution Failed';
        }

        console.error(`[BrowserService] Fetch attempt ${attempt} failed for ${url}. Reason: ${failureReason} | Detail: ${errorMessage}`);

        if (attempt > maxRetries) {
          // Throw formatted error so the orchestrator knows what happened
          const finalError = new Error(`Failed to fetch ${url} after ${attempt - 1} retries.`);
          finalError.reason = failureReason; 
          finalError.details = errorMessage;
          throw finalError;
        }

        // Exponential backoff strategy: 2s, 4s, 8s...
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`[BrowserService] Waiting ${delay}ms before retrying...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
}

module.exports = BrowserService;
