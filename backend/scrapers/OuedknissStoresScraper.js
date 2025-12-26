const BaseScraper = require('./BaseScraper');
const logger = require('../utils/logger');
const scraperConfig = require('../config/scraper.config');

class OuedknissStoresScraper extends BaseScraper {
  constructor() {
    super('ouedkniss');
    this.stores = scraperConfig.marketplaces.ouedkniss.stores || [];
  }

  async scrapeStore(page, store) {
    const phones = [];
    const maxPages = 3; // Limit pages per store

    logger.info(`Scraping store: ${store.name} (ID: ${store.id})`);

    try {
      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        const url = pageNum === 1 
          ? store.url 
          : `${store.url}?page=${pageNum}`;

        try {
          await page.goto(url, { 
            waitUntil: 'domcontentloaded',
            timeout: 60000 
          });

          await this.sleep(3000);

          // Extract listings
          const pagePhones = await page.evaluate((storeName) => {
            const items = [];
            
            const selectors = [
              '[class*="card"]',
              '.o-announ',
              'article',
              '[data-id]'
            ];

            let listings = [];
            let usedSelector = 'none';
            
            for (const selector of selectors) {
              const elements = document.querySelectorAll(selector);
              if (elements.length > 0) {
                listings = Array.from(elements);
                usedSelector = selector;
                break;
              }
            }

            listings.forEach(item => {
              try {
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

                if (title && title.length > 3) {
                  items.push({
                    title,
                    price,
                    link,
                    image,
                    location,
                    storeName
                  });
                }
              } catch (e) {
                // Skip problematic items
              }
            });

            return { items, usedSelector };
          }, store.name);

          if (!pagePhones.items || pagePhones.items.length === 0) {
            logger.info(`  No more items on page ${pageNum} for ${store.name}`);
            break;
          }

          // Process items
          pagePhones.items.forEach(item => {
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
              stock_level: 5, // Stores usually have better stock
              availability_status: 'in_stock',
              location: item.location,
              seller_name: item.storeName,
              seller_type: 'store'
            };

            phones.push(phone);
          });

          logger.info(`  Page ${pageNum}: Found ${pagePhones.items.length} items from ${store.name}`);

          // Random delay between pages
          if (pageNum < maxPages) {
            await this.randomDelay();
          }
        } catch (error) {
          logger.error(`  Error on page ${pageNum} for ${store.name}:`, error.message);
          break;
        }
      }
    } catch (error) {
      logger.error(`Error scraping store ${store.name}:`, error.message);
    }

    return phones;
  }

  async scrape() {
    const allPhones = [];
    let page;

    try {
      await this.initBrowser();
      page = await this.browser.newPage();
      
      // Anti-detection measures
      await page.setUserAgent(this.getRandomUserAgent());
      await page.setViewport({ width: 1920, height: 1080 });
      
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7,ar;q=0.6',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      });

      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => false
        });
      });

      // Scrape each store
      for (const store of this.stores) {
        const storePhones = await this.scrapeStore(page, store);
        allPhones.push(...storePhones);
        
        // Longer delay between stores to be respectful
        await this.sleep(5000);
      }

      logger.info(`Total items scraped from all stores: ${allPhones.length}`);

      if (page) {
        await page.close();
      }
      
      return allPhones;
    } catch (error) {
      logger.error('Ouedkniss stores scraping error:', error.message);
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

module.exports = OuedknissStoresScraper;
