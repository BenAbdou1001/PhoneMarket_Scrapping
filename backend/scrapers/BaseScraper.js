const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const logger = require('../utils/logger');
const scraperConfig = require('../config/scraper.config');

class BaseScraper {
  constructor(marketplaceName) {
    this.marketplaceName = marketplaceName;
    this.config = scraperConfig.marketplaces[marketplaceName];
    this.scraperConfig = scraperConfig.scraping;
    this.userAgents = scraperConfig.userAgents;
    this.browser = null;
    this.currentProxy = null;
  }

  // Get random user agent
  getRandomUserAgent() {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  // Get random delay
  getRandomDelay() {
    const { min, max } = this.scraperConfig.delays;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Sleep utility
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Random delay between requests
  async randomDelay() {
    const delay = this.getRandomDelay();
    logger.debug(`Waiting ${delay}ms before next request`);
    await this.sleep(delay);
  }

  // Initialize puppeteer browser
  async initBrowser() {
    if (this.browser) {
      return this.browser;
    }

    logger.info('Initializing Puppeteer browser...');
    
    const launchOptions = {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--single-process', // Add single process mode for macOS
        '--no-zygote' // Disable zygote process
      ],
      timeout: 60000,
      protocolTimeout: 60000,
      dumpio: false // Disable pipe dumping to reduce overhead
    };

    // Try to use system Chrome if available
    const executablePaths = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser'
    ];

    for (const path of executablePaths) {
      const fs = require('fs');
      if (fs.existsSync(path)) {
        launchOptions.executablePath = path;
        logger.info(`Using Chrome at: ${path}`);
        break;
      }
    }

    if (this.scraperConfig.useProxy && this.currentProxy) {
      launchOptions.args.push(`--proxy-server=${this.currentProxy}`);
    }

    // Retry logic for browser launch
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        logger.info(`Browser launch attempt ${attempt}/3...`);
        this.browser = await puppeteer.launch(launchOptions);
        logger.info('Browser launched successfully');
        return this.browser;
      } catch (error) {
        lastError = error;
        logger.warn(`Browser launch attempt ${attempt} failed: ${error.message}`);
        if (attempt < 3) {
          await this.sleep(2000 * attempt); // Progressive backoff
        }
      }
    }
    
    throw new Error(`Failed to launch browser after 3 attempts: ${lastError.message}`);
  }

  // Close browser
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      logger.info('Browser closed');
    }
  }

  // Make HTTP request with axios
  async makeRequest(url, options = {}) {
    const config = {
      url,
      method: options.method || 'GET',
      headers: {
        'User-Agent': this.getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7,ar;q=0.6',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        ...options.headers
      },
      timeout: this.scraperConfig.requestTimeout,
      ...options
    };

    if (this.scraperConfig.useProxy && this.currentProxy) {
      config.proxy = this.parseProxy(this.currentProxy);
    }

    let lastError;
    for (let attempt = 1; attempt <= this.scraperConfig.maxRetries; attempt++) {
      try {
        logger.debug(`Request attempt ${attempt} to ${url}`);
        const response = await axios(config);
        return response;
      } catch (error) {
        lastError = error;
        logger.warn(`Request attempt ${attempt} failed:`, error.message);
        
        if (attempt < this.scraperConfig.maxRetries) {
          const backoffDelay = Math.pow(2, attempt) * 1000;
          logger.debug(`Backing off for ${backoffDelay}ms`);
          await this.sleep(backoffDelay);
        }
      }
    }

    throw lastError;
  }

  // Parse HTML with Cheerio
  parseHTML(html) {
    return cheerio.load(html);
  }

  // Parse proxy string
  parseProxy(proxyString) {
    // Format: http://username:password@host:port
    const url = new URL(proxyString);
    return {
      protocol: url.protocol.replace(':', ''),
      host: url.hostname,
      port: parseInt(url.port),
      auth: url.username && url.password ? {
        username: url.username,
        password: url.password
      } : undefined
    };
  }

  // Normalize price to DZD
  normalizePrice(priceString) {
    if (!priceString) return null;

    // Remove currency symbols and spaces
    const cleaned = priceString.replace(/[^\d.,]/g, '');
    
    // Handle different decimal separators
    const normalized = cleaned.replace(',', '.');
    
    // Convert to float
    const price = parseFloat(normalized);
    
    return isNaN(price) ? null : price;
  }

  // Detect phone category
  detectCategory(title, description = '') {
    const text = (title + ' ' + description).toLowerCase();
    
    if (text.includes('tablet') || text.includes('tablette')) {
      return 'tablet';
    }
    
    if (text.includes('feature phone') || text.includes('téléphone basique')) {
      return 'feature_phone';
    }
    
    if (text.includes('accessoire') || text.includes('accessory') || 
        text.includes('case') || text.includes('charger')) {
      return 'accessory';
    }
    
    return 'smartphone';
  }

  // Detect condition
  detectCondition(title, description = '') {
    const text = (title + ' ' + description).toLowerCase();
    
    if (text.includes('neuf') || text.includes('new') || text.includes('nouveau')) {
      return 'new';
    }
    
    if (text.includes('comme neuf') || text.includes('like new') || text.includes('excellent')) {
      return 'like_new';
    }
    
    if (text.includes('pièces') || text.includes('parts') || text.includes('défectueux')) {
      return 'for_parts';
    }
    
    return 'used';
  }

  // Extract brand from title
  extractBrand(title) {
    const brands = [
      'Samsung', 'Apple', 'iPhone', 'Huawei', 'Xiaomi', 'Oppo', 'Vivo',
      'OnePlus', 'Realme', 'Nokia', 'Sony', 'LG', 'Motorola', 'Google',
      'Pixel', 'Asus', 'ZTE', 'Honor', 'Infinix', 'Tecno', 'Poco',
      'Redmi', 'Galaxy', 'Condor'
    ];

    const titleUpper = title.toUpperCase();
    
    for (const brand of brands) {
      if (titleUpper.includes(brand.toUpperCase())) {
        // Special handling for iPhone/Apple
        if (brand === 'iPhone' || brand === 'Pixel') {
          return brand === 'iPhone' ? 'Apple' : 'Google';
        }
        return brand;
      }
    }

    return 'Unknown';
  }

  // Clean model name
  cleanModelName(title) {
    // Remove common words
    const removeWords = ['neuf', 'new', 'used', 'occasion', 'comme neuf', 'original', 'authentic'];
    let cleaned = title;
    
    removeWords.forEach(word => {
      const regex = new RegExp(word, 'gi');
      cleaned = cleaned.replace(regex, '');
    });
    
    return cleaned.trim();
  }

  // Abstract method - must be implemented by subclasses
  async scrape() {
    throw new Error('scrape() method must be implemented by subclass');
  }

  // Run scraper with error handling
  async run() {
    const startTime = Date.now();
    logger.info(`Starting ${this.marketplaceName} scraper...`);

    try {
      const results = await this.scrape();
      const duration = Math.floor((Date.now() - startTime) / 1000);
      
      logger.info(`${this.marketplaceName} scraping completed`, {
        itemsScraped: results.length,
        duration: `${duration}s`
      });

      return {
        success: true,
        marketplace: this.marketplaceName,
        data: results,
        stats: {
          itemsScraped: results.length,
          duration
        }
      };
    } catch (error) {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      
      logger.error(`${this.marketplaceName} scraping failed`, {
        error: error.message,
        stack: error.stack,
        duration: `${duration}s`
      });

      return {
        success: false,
        marketplace: this.marketplaceName,
        error: error.message,
        stats: {
          duration
        }
      };
    } finally {
      await this.closeBrowser();
    }
  }
}

module.exports = BaseScraper;
