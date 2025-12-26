require('dotenv').config();
const jobManager = require('./jobManager');
const logger = require('../utils/logger');

async function startScheduler() {
  logger.info('=== Starting Scraping Scheduler ===');

  try {
    // Initialize scheduled jobs
    await jobManager.initializeJobs();

    logger.info('Scheduler started successfully');
    logger.info('Press Ctrl+C to stop');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('\nShutting down scheduler...');
      jobManager.stopAll();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('\nShutting down scheduler...');
      jobManager.stopAll();
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to start scheduler:', error);
    process.exit(1);
  }
}

// Start if run directly
if (require.main === module) {
  startScheduler();
}

module.exports = { startScheduler };
