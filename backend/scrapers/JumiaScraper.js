const BaseScraper = require('./BaseScraper');
const logger = require('../utils/logger');

class JumiaScraper extends BaseScraper {
  constructor() {
    super('jumia');
  }

  async scrape() {
    const phones = [];
    const maxPages = 10;

    try {
      await this.initBrowser();
      const page = await this.browser.newPage();
      
      // Set user agent
      await page.setUserAgent(this.getRandomUserAgent());
      
      // Set viewport
      await page.setViewport({ width: 1920, height: 1080 });

      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        logger.info(`Scraping Jumia page ${pageNum}...`);
        
        const url = `${this.config.searchUrl}?page=${pageNum}`;
        
        try {
          await page.goto(url, { 
            waitUntil: 'domcontentloaded',
            timeout: 60000 
          });

          // Wait for product grid to load
          await page.waitForSelector('.prd, article.prd', { timeout: 10000 });

          // Extract data
          const pagePhones = await page.evaluate(() => {
            const products = [];
            const items = document.querySelectorAll('.prd, article.prd');

            items.forEach(item => {
              try {
                const nameEl = item.querySelector('.name, .info h3 a');
                const priceEl = item.querySelector('.prc, .price');
                const linkEl = item.querySelector('a.core');
                const imageEl = item.querySelector('img.img');
                const ratingEl = item.querySelector('.stars, .rating');
                const discountEl = item.querySelector('.bdg._dsct, .discount');

                const name = nameEl ? nameEl.textContent.trim() : '';
                const price = priceEl ? priceEl.textContent.trim() : '';
                const link = linkEl ? linkEl.href : (item.querySelector('a') ? item.querySelector('a').href : '');
                const image = imageEl ? imageEl.getAttribute('data-src') || imageEl.src : '';
                const rating = ratingEl ? ratingEl.textContent.trim() : '';
                const discount = discountEl ? discountEl.textContent.trim() : '';

                if (name) {
                  products.push({
                    title: name,
                    price: price,
                    link: link,
                    image: image,
                    rating: rating,
                    discount: discount
                  });
                }
              } catch (e) {
                console.error('Error parsing item:', e);
              }
            });

            return products;
          });

          // Process extracted data
          pagePhones.forEach(item => {
            const phone = {
              model: this.cleanModelName(item.title),
              brand: this.extractBrand(item.title),
              category: this.detectCategory(item.title),
              price: this.normalizePrice(item.price),
              currency: 'DZD',
              condition: 'new', // Jumia primarily sells new items
              image_url: item.image,
              source_url: item.link,
              marketplace_name: 'jumia',
              listing_count: 1,
              stock_level: 5, // Assume medium stock
              availability_status: 'in_stock',
              rating: item.rating,
              discount: item.discount
            };

            phones.push(phone);
            logger.debug(`Extracted: ${phone.brand} ${phone.model}`);
          });

          logger.info(`Page ${pageNum}: Found ${pagePhones.length} listings`);

          // Check if there's a next page
          const hasNextPage = await page.evaluate(() => {
            const nextButton = document.querySelector('a[aria-label="Next Page"]');
            return nextButton && !nextButton.classList.contains('disabled');
          });

          if (!hasNextPage || pagePhones.length === 0) {
            logger.info('No more pages available');
            break;
          }

          // Random delay between pages
          if (pageNum < maxPages) {
            await this.randomDelay();
          }
        } catch (error) {
          logger.error(`Error on page ${pageNum}:`, error.message);
          // Continue to next page
        }
      }

      await page.close();
      return phones;
    } catch (error) {
      logger.error('Jumia scraping error:', error);
      throw error;
    }
  }
}

module.exports = JumiaScraper;
