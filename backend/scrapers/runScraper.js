const OuedknissScraper = require('./OuedknissScraper');
const JumiaScraper = require('./JumiaScraper');
const FacebookScraper = require('./FacebookScraper');
const logger = require('../utils/logger');
const phoneService = require('../services/phoneService');
const notifications = require('../utils/notifications');

const scrapers = {
  ouedkniss: OuedknissScraper,
  jumia: JumiaScraper,
  facebook: FacebookScraper
};

async function runScraper(marketplace) {
  logger.info(`=== Starting ${marketplace} scraper ===`);

  const ScraperClass = scrapers[marketplace];
  if (!ScraperClass) {
    throw new Error(`Unknown marketplace: ${marketplace}`);
  }

  const scraper = new ScraperClass();
  const result = await scraper.run();

  if (result.success) {
    // Save scraped data
    logger.info(`Saving ${result.data.length} items to database...`);
    const saveResult = await phoneService.saveScrapedData(result.data, marketplace);
    
    result.stats.newListings = saveResult.newListings;
    result.stats.updatedListings = saveResult.updatedListings;

    // Send success notification
    await notifications.notifyScrapingSuccess(marketplace, result.stats);
    
    logger.info(`✓ ${marketplace} scraping completed successfully`);
  } else {
    // Send failure notification
    await notifications.notifyScrapingFailure(marketplace, new Error(result.error));
    
    logger.error(`✗ ${marketplace} scraping failed: ${result.error}`);
  }

  return result;
}

async function runAllScrapers() {
  logger.info('=== Starting all scrapers ===');
  
  const results = {};
  
  for (const marketplace of Object.keys(scrapers)) {
    try {
      results[marketplace] = await runScraper(marketplace);
    } catch (error) {
      logger.error(`Failed to run ${marketplace} scraper:`, error);
      results[marketplace] = {
        success: false,
        marketplace,
        error: error.message
      };
    }
  }
  
  logger.info('=== All scrapers completed ===');
  return results;
}

// Run if called directly
if (require.main === module) {
  const marketplace = process.argv[2];

  if (!marketplace) {
    console.error('Usage: node runScraper.js <marketplace|all>');
    console.error('Available marketplaces: ouedkniss, jumia, facebook, all');
    process.exit(1);
  }

  const execute = marketplace === 'all' 
    ? runAllScrapers() 
    : runScraper(marketplace);

  execute
    .then(result => {
      console.log('Scraping completed:', JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('Scraping failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runScraper,
  runAllScrapers
};
