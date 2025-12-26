#!/usr/bin/env node

const OuedknissStoresScraper = require('../scrapers/OuedknissStoresScraper');
const logger = require('../utils/logger');
const db = require('../database/connection');

async function scrapeStores() {
  logger.info('=== Starting Ouedkniss Stores Scraping ===');
  
  const scraper = new OuedknissStoresScraper();
  
  try {
    const phones = await scraper.scrape();
    
    if (phones.length > 0) {
      logger.info(`\n=== Saving ${phones.length} items to database ===`);
      
      let saved = 0;
      let updated = 0;
      let errors = 0;
      
      for (const phone of phones) {
        try {
          // Check if phone exists by model and source_url
          const existing = await db.query(
            'SELECT id FROM phones WHERE model = ? AND marketplace_name = ? LIMIT 1',
            [phone.model, phone.marketplace_name]
          );
          
          if (existing && existing.length > 0) {
            // Update existing
            await db.query(
              `UPDATE phones SET 
                brand = ?, category = ?, price = ?, currency = ?, 
                condition_type = ?, image_url = ?, source_url = ?, 
                location = ?, seller_name = ?, seller_type = ?,
                updated_at = NOW()
              WHERE id = ?`,
              [
                phone.brand, phone.category, phone.price, phone.currency,
                phone.condition, phone.image_url, phone.source_url,
                phone.location, phone.seller_name, phone.seller_type,
                existing[0].id
              ]
            );
            updated++;
          } else {
            // Insert new
            await db.query(
              `INSERT INTO phones (
                brand, model, category, price, currency, condition_type,
                image_url, source_url, marketplace_name, listing_count,
                stock_level, availability_status, location, seller_name, seller_type
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                phone.brand, phone.model, phone.category, phone.price, phone.currency,
                phone.condition, phone.image_url, phone.source_url, phone.marketplace_name,
                phone.listing_count, phone.stock_level, phone.availability_status,
                phone.location, phone.seller_name, phone.seller_type
              ]
            );
            saved++;
          }
        } catch (err) {
          logger.error(`Error saving phone "${phone.model}":`, String(err.message || err));
          errors++;
        }
      }
      
      logger.info(`\n=== Results ===`);
      logger.info(`✅ New phones saved: ${saved}`);
      logger.info(`♻️  Phones updated: ${updated}`);
      logger.info(`❌ Errors: ${errors}`);
      logger.info(`📊 Total processed: ${phones.length}`);
    } else {
      logger.warn('No phones scraped from stores');
    }
    
  } catch (error) {
    logger.error('Store scraping failed:', String(error.message || error));
  } finally {
    await scraper.closeBrowser();
    process.exit(0);
  }
}

scrapeStores();
