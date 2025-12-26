const BaseScraper = require('./BaseScraper');
const logger = require('../utils/logger');

class OuedknissScraper extends BaseScraper {
  constructor() {
    super('ouedkniss');
  }

  async scrape() {
    const phones = [];
    const maxPages = 5; // Limit to prevent excessive scraping
    let page;

    try {
      await this.initBrowser();
      page = await this.browser.newPage();
      
      // Anti-detection measures
      await page.setUserAgent(this.getRandomUserAgent());
      await page.setViewport({ width: 1920, height: 1080 });
      
      // Set extra headers to appear more like a real browser
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7,ar;q=0.6',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      });

      // Stealth mode: remove webdriver flag
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => false
        });
      });

      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        logger.info(`Scraping Ouedkniss page ${pageNum}...`);
        
        const url = pageNum === 1 
          ? this.config.searchUrl 
          : `${this.config.searchUrl}?page=${pageNum}`;
        
        try {
          // Navigate to page
          await page.goto(url, { 
            waitUntil: 'domcontentloaded',
            timeout: 60000 
          });

          // Wait for listings to load with multiple possible selectors
          await this.sleep(5000); // Increase wait time

          // Take screenshot for debugging
          await page.screenshot({ path: 'ouedkniss-debug.png', fullPage: false });
          logger.info('Screenshot saved to ouedkniss-debug.png');

          // Debug: Save page content to see what we're getting
          const pageContent = await page.content();
          logger.info(`Page content length: ${pageContent.length} characters`);
          
          // Check if we got blocked
          if (pageContent.includes('captcha') || pageContent.includes('blocked') || pageContent.includes('Access Denied')) {
            logger.warn('Detected anti-bot protection (captcha/blocked)');
          }

          // Extract data using multiple selector strategies
          const pagePhones = await page.evaluate(() => {
            const items = [];
            
            // Try multiple selector patterns for Ouedkniss
            const selectors = [
              '.card-container .o-announ',
              'article.o-announ',
              '.classified-card',
              '[data-id]',
              'a[href*="/annonce/"]',
              '.css-1sw7q4x', // Possible MUI class
              '[class*="listing"]',
              '[class*="card"]'
            ];

            let listings = [];
            let usedSelector = 'none';
            
            // Find which selector works
            for (const selector of selectors) {
              const elements = document.querySelectorAll(selector);
              if (elements.length > 0) {
                listings = Array.from(elements);
                usedSelector = selector;
                console.log(`Found ${listings.length} items with selector: ${selector}`);
                break;
              }
            }

            // Also log page structure for debugging
            const bodyClasses = document.body ? document.body.className : 'no-body';
            const mainContent = document.querySelector('main, #root, [id*="app"]');
            const hasReact = !!document.querySelector('[data-reactroot], [data-react-root]');
            
            console.log('Debug - Body classes:', bodyClasses);
            console.log('Debug - Has React:', hasReact);
            console.log('Debug - Main content:', mainContent ? mainContent.tagName : 'not found');

            listings.forEach(item => {
              try {
                // Try multiple ways to extract data
                const titleEl = item.querySelector('.card-title a, h3 a, .title, [class*="title"]');
                const priceEl = item.querySelector('.price, [class*="price"]');
                const linkEl = item.querySelector('a[href*="/annonce/"], a');
                const imageEl = item.querySelector('img');
                const locationEl = item.querySelector('.card-address, [class*="location"], [class*="address"]');

                const title = titleEl ? titleEl.textContent.trim() : '';
                const price = priceEl ? priceEl.textContent.trim() : '';
                const link = linkEl ? linkEl.href : '';
                const image = imageEl ? (imageEl.src || imageEl.dataset.src || imageEl.getAttribute('data-lazy-src')) : '';
                const location = locationEl ? locationEl.textContent.trim() : '';

                if (title && title.length > 0) {
                  items.push({
                    title,
                    price,
                    link,
                    image,
                    location
                  });
                }
              } catch (e) {
                console.error('Error parsing item:', e);
              }
            });

            // Debug: also return what selectors found
            return { 
              items, 
              debug: { 
                totalElements: listings.length,
                usedSelector,
                bodyClasses,
                hasReact,
                mainContentTag: mainContent ? mainContent.tagName : 'not found'
              } 
            };
          });

          logger.debug(`Debug info:`, pagePhones.debug);
          logger.info(`Selector used: ${pagePhones.debug?.usedSelector}, Found ${pagePhones.debug?.totalElements} elements`);
          const items = pagePhones.items || pagePhones;

          if (!Array.isArray(items) || items.length === 0) {
            logger.info('No listings found on this page');
            break;
          }

          // Process extracted data
          items.forEach(item => {
            const phone = {
              model: this.cleanModelName(item.title),
              brand: this.extractBrand(item.title),
              category: this.detectCategory(item.title),
              price: this.normalizePrice(item.price),
              currency: 'DZD',
              condition: this.detectCondition(item.title),
              image_url: item.image ? (item.image.startsWith('http') ? item.image : `https://www.ouedkniss.com${item.image}`) : null,
              source_url: item.link ? (item.link.startsWith('http') ? item.link : `https://www.ouedkniss.com${item.link}`) : null,
              marketplace_name: 'ouedkniss',
              listing_count: 1,
              stock_level: 1,
              availability_status: 'in_stock',
              location: item.location
            };

            phones.push(phone);
            logger.debug(`Extracted: ${phone.brand} ${phone.model} - ${phone.price} DZD`);
          });

          logger.info(`Page ${pageNum}: Found ${items.length} listings`);

          // Random delay between pages to appear more human-like
          if (pageNum < maxPages) {
            await this.randomDelay();
          }
        } catch (error) {
          logger.error(`Error on page ${pageNum}:`, error.message);
          // Continue to next page
        }
      }

      if (page) {
        await page.close();
      }
      return phones;
    } catch (error) {
      logger.error('Ouedkniss scraping error:', error.message);
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

module.exports = OuedknissScraper;
