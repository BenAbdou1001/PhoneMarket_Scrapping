const logger = require('./logger');

class NotificationService {
  constructor() {
    this.transporter = null;
    // Email notifications disabled for now
    // this.initTransporter();
  }

  initTransporter() {
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
      logger.warn('Email configuration not found. Email notifications disabled.');
      return;
    }

    try {
      const nodemailer = require('nodemailer');
      this.transporter = nodemailer.createTransporter({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });
    } catch (error) {
      logger.error('Failed to initialize email transporter:', error);
    }
  }

  async sendEmail(to, subject, html, text) {
    if (!this.transporter) {
      logger.warn('Email transporter not initialized. Skipping email.');
      return false;
    }

    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@phonescraper.dz',
        to,
        subject,
        text,
        html
      });

      logger.info(`Email sent: ${info.messageId}`);
      return true;
    } catch (error) {
      logger.error('Failed to send email:', error);
      return false;
    }
  }

  async notifyScrapingFailure(marketplace, error) {
    const subject = `Scraping Failed: ${marketplace}`;
    const html = `
      <h2>Scraping Job Failed</h2>
      <p><strong>Marketplace:</strong> ${marketplace}</p>
      <p><strong>Time:</strong> ${new Date().toISOString()}</p>
      <p><strong>Error:</strong> ${error.message}</p>
      <pre>${error.stack}</pre>
    `;
    const text = `Scraping failed for ${marketplace}. Error: ${error.message}`;

    await this.sendEmail(process.env.ADMIN_EMAIL, subject, html, text);
  }

  async notifyScrapingSuccess(marketplace, stats) {
    const subject = `Scraping Completed: ${marketplace}`;
    const html = `
      <h2>Scraping Job Completed Successfully</h2>
      <p><strong>Marketplace:</strong> ${marketplace}</p>
      <p><strong>Time:</strong> ${new Date().toISOString()}</p>
      <p><strong>Items Scraped:</strong> ${stats.itemsScraped}</p>
      <p><strong>Duration:</strong> ${stats.duration}s</p>
      <p><strong>New Listings:</strong> ${stats.newListings || 0}</p>
      <p><strong>Updated Listings:</strong> ${stats.updatedListings || 0}</p>
    `;
    const text = `Scraping completed for ${marketplace}. Items: ${stats.itemsScraped}, Duration: ${stats.duration}s`;

    await this.sendEmail(process.env.ADMIN_EMAIL, subject, html, text);
  }

  async notifyDataQualityIssue(issue) {
    const subject = 'Data Quality Issue Detected';
    const html = `
      <h2>Data Quality Alert</h2>
      <p><strong>Issue Type:</strong> ${issue.type}</p>
      <p><strong>Description:</strong> ${issue.description}</p>
      <p><strong>Affected Records:</strong> ${issue.affectedRecords}</p>
      <p><strong>Time:</strong> ${new Date().toISOString()}</p>
    `;
    const text = `Data quality issue: ${issue.description}`;

    await this.sendEmail(process.env.ADMIN_EMAIL, subject, html, text);
  }

  logToConsole(type, message, data = {}) {
    switch (type) {
      case 'error':
        logger.error(message, data);
        break;
      case 'warning':
        logger.warn(message, data);
        break;
      case 'success':
        logger.info(message, data);
        break;
      default:
        logger.info(message, data);
    }
  }
}

module.exports = new NotificationService();
