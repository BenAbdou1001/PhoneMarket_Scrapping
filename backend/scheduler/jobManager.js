const cron = require('node-cron');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const { query } = require('../database/connection');
const { runScraper } = require('../scrapers/runScraper');
const scraperConfig = require('../config/scraper.config');

class JobManager {
  constructor() {
    this.jobs = new Map();
    this.runningJobs = new Set();
  }

  // Initialize jobs from database
  async initializeJobs() {
    logger.info('Initializing scheduled jobs...');

    const marketplaces = Object.keys(scraperConfig.marketplaces);

    for (const marketplace of marketplaces) {
      const config = scraperConfig.marketplaces[marketplace];
      
      if (!config.enabled) {
        logger.info(`${marketplace} is disabled, skipping...`);
        continue;
      }

      // Check if job exists in database
      let jobRecord = await this.getJobRecord(marketplace);

      if (!jobRecord) {
        // Create new job record
        jobRecord = await this.createJobRecord(marketplace, config.scheduleHours);
      }

      // Schedule the job
      this.scheduleJob(marketplace, config.scheduleHours);
    }

    logger.info(`Initialized ${this.jobs.size} scheduled jobs`);
  }

  // Get job record from database
  async getJobRecord(marketplace) {
    const sql = `SELECT * FROM scraping_jobs WHERE marketplace_name = ?`;
    const results = await query(sql, [marketplace]);
    return results[0] || null;
  }

  // Create job record in database
  async createJobRecord(marketplace, scheduleHours) {
    const jobId = uuidv4();
    const nextRun = new Date(Date.now() + scheduleHours * 60 * 60 * 1000);

    const sql = `
      INSERT INTO scraping_jobs (
        job_id, marketplace_name, schedule_frequency, 
        next_run, status
      ) VALUES (?, ?, ?, ?, 'idle')
    `;

    await query(sql, [jobId, marketplace, scheduleHours, nextRun]);

    logger.info(`Created job record for ${marketplace}`);
    return { job_id: jobId, marketplace_name: marketplace, schedule_frequency: scheduleHours };
  }

  // Schedule a job
  scheduleJob(marketplace, hours) {
    // Convert hours to cron expression
    // Run every X hours
    const cronExpression = `0 */${hours} * * *`;

    const job = cron.schedule(cronExpression, async () => {
      await this.executeJob(marketplace);
    }, {
      scheduled: true,
      timezone: "Africa/Algiers"
    });

    this.jobs.set(marketplace, job);
    
    logger.info(`Scheduled ${marketplace} to run every ${hours} hours (${cronExpression})`);
  }

  // Execute a job
  async executeJob(marketplace) {
    // Check if already running
    if (this.runningJobs.has(marketplace)) {
      logger.warn(`${marketplace} job is already running, skipping...`);
      return;
    }

    this.runningJobs.add(marketplace);
    const startTime = Date.now();

    try {
      logger.info(`Executing scheduled job for ${marketplace}...`);

      // Update job status to running
      await this.updateJobStatus(marketplace, 'running', null);

      // Run the scraper
      const result = await runScraper(marketplace);

      const duration = Math.floor((Date.now() - startTime) / 1000);

      // Update job record
      await this.updateJobCompletion(
        marketplace,
        result.success ? 'completed' : 'failed',
        result.stats.itemsScraped || 0,
        duration,
        result.error || null
      );

      logger.info(`${marketplace} job completed in ${duration}s`);
    } catch (error) {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      
      logger.error(`${marketplace} job failed:`, error);
      
      await this.updateJobCompletion(
        marketplace,
        'failed',
        0,
        duration,
        error.message
      );
    } finally {
      this.runningJobs.delete(marketplace);
    }
  }

  // Update job status
  async updateJobStatus(marketplace, status, errorMessage) {
    const sql = `
      UPDATE scraping_jobs 
      SET status = ?, error_message = ?, updated_at = NOW()
      WHERE marketplace_name = ?
    `;

    await query(sql, [status, errorMessage, marketplace]);
  }

  // Update job completion
  async updateJobCompletion(marketplace, status, itemsScraped, duration, errorMessage) {
    const config = scraperConfig.marketplaces[marketplace];
    const nextRun = new Date(Date.now() + config.scheduleHours * 60 * 60 * 1000);

    const sql = `
      UPDATE scraping_jobs 
      SET 
        status = ?,
        last_run = NOW(),
        next_run = ?,
        items_scraped = ?,
        duration = ?,
        error_message = ?,
        updated_at = NOW()
      WHERE marketplace_name = ?
    `;

    await query(sql, [status, nextRun, itemsScraped, duration, errorMessage, marketplace]);

    // Log the completion
    await this.logJob(marketplace, status, itemsScraped, duration, errorMessage);
  }

  // Log job execution
  async logJob(marketplace, status, itemsScraped, duration, errorMessage) {
    const jobRecord = await this.getJobRecord(marketplace);
    
    const sql = `
      INSERT INTO scraping_logs (
        job_id, marketplace_name, log_level, message, details
      ) VALUES (?, ?, ?, ?, ?)
    `;

    const logLevel = status === 'failed' ? 'error' : 'info';
    const message = status === 'failed' 
      ? `Scraping failed: ${errorMessage}`
      : `Scraping completed: ${itemsScraped} items in ${duration}s`;

    const details = JSON.stringify({
      status,
      items_scraped: itemsScraped,
      duration,
      error: errorMessage
    });

    await query(sql, [jobRecord.job_id, marketplace, logLevel, message, details]);
  }

  // Manually trigger a job
  async triggerJob(marketplace) {
    if (!scraperConfig.marketplaces[marketplace]) {
      throw new Error(`Unknown marketplace: ${marketplace}`);
    }

    logger.info(`Manually triggering ${marketplace} job...`);
    await this.executeJob(marketplace);
  }

  // Get all job statuses
  async getJobStatuses() {
    const sql = `
      SELECT * FROM scraping_jobs 
      ORDER BY marketplace_name
    `;

    const jobs = await query(sql);

    // Add running status
    return jobs.map(job => ({
      ...job,
      is_running: this.runningJobs.has(job.marketplace_name)
    }));
  }

  // Update job schedule
  async updateJobSchedule(marketplace, hours) {
    const nextRun = new Date(Date.now() + hours * 60 * 60 * 1000);

    const sql = `
      UPDATE scraping_jobs 
      SET schedule_frequency = ?, next_run = ?, updated_at = NOW()
      WHERE marketplace_name = ?
    `;

    await query(sql, [hours, nextRun, marketplace]);

    // Reschedule the cron job
    if (this.jobs.has(marketplace)) {
      this.jobs.get(marketplace).stop();
      this.jobs.delete(marketplace);
    }

    this.scheduleJob(marketplace, hours);
    
    logger.info(`Updated ${marketplace} schedule to every ${hours} hours`);
  }

  // Stop all jobs
  stopAll() {
    logger.info('Stopping all scheduled jobs...');
    
    for (const [marketplace, job] of this.jobs.entries()) {
      job.stop();
      logger.info(`Stopped ${marketplace} job`);
    }

    this.jobs.clear();
  }
}

module.exports = new JobManager();
