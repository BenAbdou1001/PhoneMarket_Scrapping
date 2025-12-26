const express = require('express');
const router = express.Router();
const jobManager = require('../scheduler/jobManager');
const { query } = require('../database/connection');
const { validate } = require('../middleware/validation');
const logger = require('../utils/logger');

// Get all scraping jobs status
router.get('/jobs', async (req, res, next) => {
  try {
    const jobs = await jobManager.getJobStatuses();
    
    res.json({
      success: true,
      data: jobs
    });
  } catch (error) {
    next(error);
  }
});

// Manually trigger a scraping job
router.post('/jobs/:marketplace/trigger', async (req, res, next) => {
  try {
    const { marketplace } = req.params;
    
    // Trigger job asynchronously
    jobManager.triggerJob(marketplace).catch(error => {
      logger.error(`Manual job trigger failed for ${marketplace}:`, error);
    });

    res.json({
      success: true,
      message: `Scraping job for ${marketplace} has been triggered`
    });
  } catch (error) {
    next(error);
  }
});

// Update job schedule
router.put('/jobs/:marketplace/schedule', validate('updateSchedule'), async (req, res, next) => {
  try {
    const { marketplace } = req.params;
    const { hours } = req.body;

    await jobManager.updateJobSchedule(marketplace, hours);

    res.json({
      success: true,
      message: `Schedule for ${marketplace} updated to every ${hours} hours`
    });
  } catch (error) {
    next(error);
  }
});

// Get scraping logs
router.get('/logs', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const marketplace = req.query.marketplace;
    const logLevel = req.query.level;

    let sql = `SELECT * FROM scraping_logs WHERE 1=1`;
    const params = [];

    if (marketplace) {
      sql += ` AND marketplace_name = ?`;
      params.push(marketplace);
    }

    if (logLevel) {
      sql += ` AND log_level = ?`;
      params.push(logLevel);
    }

    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const logs = await query(sql, params);

    // Get total count
    let countSql = `SELECT COUNT(*) as total FROM scraping_logs WHERE 1=1`;
    const countParams = [];

    if (marketplace) {
      countSql += ` AND marketplace_name = ?`;
      countParams.push(marketplace);
    }

    if (logLevel) {
      countSql += ` AND log_level = ?`;
      countParams.push(logLevel);
    }

    const countResult = await query(countSql, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      count: logs.length,
      total,
      data: logs
    });
  } catch (error) {
    next(error);
  }
});

// Get database statistics
router.get('/database-stats', async (req, res, next) => {
  try {
    const tables = ['phones', 'phone_populations', 'price_trends', 'scraping_logs'];
    const stats = {};

    for (const table of tables) {
      const result = await query(`SELECT COUNT(*) as count FROM ${table}`);
      stats[table] = result[0].count;
    }

    // Get database size
    const sizeResult = await query(`
      SELECT 
        table_schema as 'database',
        SUM(data_length + index_length) / 1024 / 1024 as 'size_mb'
      FROM information_schema.tables 
      WHERE table_schema = ?
      GROUP BY table_schema
    `, [process.env.DB_NAME]);

    stats.database_size_mb = sizeResult[0] ? sizeResult[0].size_mb : 0;

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

// Get system health
router.get('/health', async (req, res, next) => {
  try {
    const jobs = await jobManager.getJobStatuses();
    const failedJobs = jobs.filter(job => job.status === 'failed');
    const runningJobs = jobs.filter(job => job.is_running);

    // Check last scrape times
    const staleJobs = jobs.filter(job => {
      if (!job.last_run) return true;
      const hoursSinceLastRun = (Date.now() - new Date(job.last_run).getTime()) / (1000 * 60 * 60);
      return hoursSinceLastRun > (job.schedule_frequency * 2); // Double the expected frequency
    });

    const health = {
      status: failedJobs.length === 0 && staleJobs.length === 0 ? 'healthy' : 'degraded',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      jobs: {
        total: jobs.length,
        running: runningJobs.length,
        failed: failedJobs.length,
        stale: staleJobs.length
      },
      issues: [
        ...failedJobs.map(job => `${job.marketplace_name} job failed: ${job.error_message}`),
        ...staleJobs.map(job => `${job.marketplace_name} job is stale`)
      ]
    };

    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    next(error);
  }
});

// Clean old data
router.post('/cleanup', async (req, res, next) => {
  try {
    const days = parseInt(req.body.days) || 90;

    // Delete old price trends
    const priceTrendsResult = await query(`
      DELETE FROM price_trends 
      WHERE recorded_date < DATE_SUB(CURDATE(), INTERVAL ? DAY)
    `, [days]);

    // Delete old logs
    const logsResult = await query(`
      DELETE FROM scraping_logs 
      WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [days]);

    res.json({
      success: true,
      message: `Cleanup completed`,
      deleted: {
        price_trends: priceTrendsResult.affectedRows,
        logs: logsResult.affectedRows
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
