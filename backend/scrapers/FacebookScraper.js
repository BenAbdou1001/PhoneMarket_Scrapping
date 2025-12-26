const BaseScraper = require('./BaseScraper');
const logger = require('../utils/logger');

class FacebookScraper extends BaseScraper {
  constructor() {
    super('facebook');
    this.isLoggedIn = false;
  }

  async login(page) {
    if (this.isLoggedIn) {
      return true;
    }

    const { email, password } = this.config.credentials;
    
    if (!email || !password) {
      logger.warn('Facebook credentials not configured. Skipping login.');
      return false;
    }

    try {
      logger.info('Logging into Facebook...');
      
      await page.goto('https://www.facebook.com/login', { 
        waitUntil: 'networkidle2',
        timeout: 60000 
      });

      // Fill login form
      await page.type('#email', email);
      await page.type('#pass', password);
      
      // Click login button
      await page.click('button[name="login"]');
      
      // Wait for navigation
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });

      // Check if login was successful
      const currentUrl = page.url();
      if (currentUrl.includes('checkpoint') || currentUrl.includes('login')) {
        throw new Error('Login failed - verification required or invalid credentials');
      }

      this.isLoggedIn = true;
      logger.info('Successfully logged into Facebook');
      return true;
    } catch (error) {
      logger.error('Facebook login failed:', error.message);
      return false;
    }
  }

  async scrape() {
    const phones = [];
    const maxScrolls = 20; // Limit scrolling
    let page;

    try {
      await this.initBrowser();
      page = await this.browser.newPage();
      
      // Set user agent
      await page.setUserAgent(this.getRandomUserAgent());
      
      // Set viewport
      await page.setViewport({ width: 1920, height: 1080 });

      // Add error handling for page events
      page.on('error', error => {
        logger.error('Page error:', error.message);
      });

      page.on('pageerror', error => {
        logger.error('Page error in console:', error.message);
      });

      // Attempt login
      const loggedIn = await this.login(page);
      
      // Navigate to marketplace
      logger.info('Navigating to Facebook Marketplace...');
      const searchUrl = `${this.config.searchUrl}?query=phone%20smartphone`;
      
      await page.goto(searchUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: 60000 
      });

      // Wait for listings to load
      await this.sleep(5000);

      let previousHeight = 0;
      let scrollCount = 0;

      while (scrollCount < maxScrolls) {
        logger.info(`Scroll ${scrollCount + 1}/${maxScrolls}...`);

        // Extract current listings
        const newPhones = await page.evaluate(() => {
          const items = [];
          
          // Try multiple selectors for Facebook's dynamic structure
          const selectors = [
            'div[data-testid="marketplace_feed"] > div',
            'div[role="list"] > div',
            'a[href*="/marketplace/item/"]'
          ];

          let listings = [];
          for (const selector of selectors) {
            listings = document.querySelectorAll(selector);
            if (listings.length > 0) break;
          }

          listings.forEach(item => {
            try {
              // Try to extract data (Facebook's structure changes frequently)
              const link = item.querySelector('a[href*="/marketplace/item/"]');
              const img = item.querySelector('img');
              const priceEl = item.querySelector('span[aria-label*="Price"]') || 
                             item.querySelector('span:has-text("DZD")') ||
                             item.querySelector('span:has-text("DA")');
              const titleEl = item.querySelector('[role="heading"]') ||
                             item.querySelector('span > span');

              if (link && titleEl) {
                items.push({
                  title: titleEl.textContent.trim(),
                  price: priceEl ? priceEl.textContent.trim() : null,
                  link: link.href,
                  image: img ? img.src : null
                });
              }
            } catch (e) {
              // Skip problematic items
            }
          });

          return items;
        });

        // Process new listings
        newPhones.forEach(item => {
          // Check if already scraped
          if (!phones.find(p => p.source_url === item.link)) {
            const phone = {
              model: this.cleanModelName(item.title),
              brand: this.extractBrand(item.title),
              category: this.detectCategory(item.title),
              price: this.normalizePrice(item.price),
              currency: 'DZD',
              condition: this.detectCondition(item.title),
              image_url: item.image,
              source_url: item.link,
              marketplace_name: 'facebook',
              listing_count: 1,
              stock_level: 1,
              availability_status: 'in_stock'
            };

            phones.push(phone);
            logger.debug(`Extracted: ${phone.brand} ${phone.model}`);
          }
        });

        // Scroll down
        const currentHeight = await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
          return document.body.scrollHeight;
        });

        // Wait for new content
        await this.sleep(3000);

        // Check if reached bottom
        if (currentHeight === previousHeight) {
          logger.info('Reached bottom of page');
          break;
        }

        previousHeight = currentHeight;
        scrollCount++;

        // Random delay between scrolls
        await this.randomDelay();
      }

      logger.info(`Facebook scraping completed: ${phones.length} items`);

      if (page) {
        await page.close();
      }
      return phones;
    } catch (error) {
      logger.error('Facebook scraping error:', error.message);
      if (page) {
        try {
          await page.close();
        } catch (closeError) {
          logger.warn('Error closing page:', closeError.message);
        }
      }
      throw error;
    }
  }
}

module.exports = FacebookScraper;
