const { query } = require('../database/connection');
const logger = require('../utils/logger');
const fuzzball = require('fuzzball');

class PhoneService {
  // Save scraped data with deduplication
  async saveScrapedData(phonesData, marketplace) {
    let newListings = 0;
    let updatedListings = 0;

    for (const phoneData of phonesData) {
      try {
        // Find existing phone (fuzzy matching)
        const existingPhone = await this.findSimilarPhone(
          phoneData.model,
          phoneData.brand,
          phoneData.marketplace_name
        );

        if (existingPhone) {
          // Update existing phone
          await this.updatePhone(existingPhone.id, phoneData);
          updatedListings++;
        } else {
          // Create new phone
          await this.createPhone(phoneData);
          newListings++;
        }
      } catch (error) {
        logger.error('Error saving phone data:', error);
      }
    }

    // Update marketplace stats
    await this.updateMarketplaceStats(marketplace, {
      total_listings: newListings + updatedListings,
      last_scraped_at: new Date()
    });

    return { newListings, updatedListings };
  }

  // Find similar phone using fuzzy matching
  async findSimilarPhone(model, brand, marketplace) {
    const sql = `
      SELECT * FROM phones 
      WHERE brand = ? AND marketplace_name = ?
      ORDER BY created_at DESC
      LIMIT 20
    `;
    
    const phones = await query(sql, [brand, marketplace]);
    
    if (phones.length === 0) {
      return null;
    }

    // Fuzzy match on model name
    for (const phone of phones) {
      const ratio = fuzzball.ratio(model.toLowerCase(), phone.model.toLowerCase());
      if (ratio > 85) { // 85% similarity threshold
        return phone;
      }
    }

    return null;
  }

  // Create new phone
  async createPhone(phoneData) {
    const sql = `
      INSERT INTO phones (
        model, brand, category, price, currency, \`condition\`,
        image_url, source_url, marketplace_name, listing_count,
        stock_level, availability_status, scraped_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const values = [
      phoneData.model,
      phoneData.brand,
      phoneData.category,
      phoneData.price,
      phoneData.currency,
      phoneData.condition,
      phoneData.image_url,
      phoneData.source_url,
      phoneData.marketplace_name,
      phoneData.listing_count || 1,
      phoneData.stock_level || 0,
      phoneData.availability_status || 'in_stock'
    ];

    const result = await query(sql, values);
    
    // Record price trend
    if (phoneData.price) {
      await this.recordPriceTrend(result.insertId, phoneData.marketplace_name, phoneData.price);
    }

    // Record population metrics
    await this.recordPopulationMetrics(result.insertId, phoneData.marketplace_name, {
      total_listings: 1,
      stock_count: phoneData.stock_level || 0
    });

    return result.insertId;
  }

  // Update existing phone
  async updatePhone(phoneId, phoneData) {
    const sql = `
      UPDATE phones 
      SET 
        price = COALESCE(?, price),
        image_url = COALESCE(?, image_url),
        source_url = COALESCE(?, source_url),
        listing_count = listing_count + 1,
        stock_level = COALESCE(?, stock_level),
        availability_status = COALESCE(?, availability_status),
        scraped_at = NOW(),
        updated_at = NOW()
      WHERE id = ?
    `;

    const values = [
      phoneData.price,
      phoneData.image_url,
      phoneData.source_url,
      phoneData.stock_level,
      phoneData.availability_status,
      phoneId
    ];

    await query(sql, values);

    // Record price trend
    if (phoneData.price) {
      await this.recordPriceTrend(phoneId, phoneData.marketplace_name, phoneData.price);
    }

    // Update population metrics
    await this.recordPopulationMetrics(phoneId, phoneData.marketplace_name, {
      total_listings: 1,
      stock_count: phoneData.stock_level || 0
    });
  }

  // Record price trend
  async recordPriceTrend(phoneId, marketplace, price) {
    const sql = `
      INSERT INTO price_trends (phone_id, marketplace_name, price, recorded_date)
      VALUES (?, ?, ?, CURDATE())
      ON DUPLICATE KEY UPDATE
        price = ?,
        availability_count = availability_count + 1
    `;

    await query(sql, [phoneId, marketplace, price, price]);
  }

  // Record population metrics
  async recordPopulationMetrics(phoneId, marketplace, metrics) {
    const sql = `
      INSERT INTO phone_populations (
        phone_id, marketplace_source, total_listings, 
        stock_count, recorded_date
      )
      VALUES (?, ?, ?, ?, CURDATE())
      ON DUPLICATE KEY UPDATE
        total_listings = total_listings + ?,
        stock_count = stock_count + ?
    `;

    await query(sql, [
      phoneId, 
      marketplace, 
      metrics.total_listings,
      metrics.stock_count,
      metrics.total_listings,
      metrics.stock_count
    ]);
  }

  // Update marketplace stats
  async updateMarketplaceStats(marketplace, stats) {
    const sql = `
      INSERT INTO marketplace_stats (
        marketplace_name, total_listings, last_scraped_at
      )
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        total_listings = total_listings + ?,
        last_scraped_at = ?
    `;

    await query(sql, [
      marketplace,
      stats.total_listings,
      stats.last_scraped_at,
      stats.total_listings,
      stats.last_scraped_at
    ]);
  }

  // Get all phones with filters
  async getPhones(filters = {}) {
    let sql = `SELECT * FROM phones WHERE 1=1`;
    const params = [];

    if (filters.brand) {
      sql += ` AND brand = ?`;
      params.push(filters.brand);
    }

    if (filters.category) {
      sql += ` AND category = ?`;
      params.push(filters.category);
    }

    if (filters.marketplace) {
      sql += ` AND marketplace_name = ?`;
      params.push(filters.marketplace);
    }

    if (filters.condition) {
      sql += ` AND \`condition\` = ?`;
      params.push(filters.condition);
    }

    if (filters.minPrice) {
      sql += ` AND price >= ?`;
      params.push(filters.minPrice);
    }

    if (filters.maxPrice) {
      sql += ` AND price <= ?`;
      params.push(filters.maxPrice);
    }

    if (filters.availability) {
      sql += ` AND availability_status = ?`;
      params.push(filters.availability);
    }

    if (filters.search) {
      sql += ` AND (model LIKE ? OR brand LIKE ?)`;
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    // Sorting
    const sortBy = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder || 'DESC';
    sql += ` ORDER BY ${sortBy} ${sortOrder}`;

    // Pagination
    const limit = parseInt(filters.limit) || 50;
    const offset = parseInt(filters.offset) || 0;
    sql += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    return await query(sql, params);
  }

  // Get phone by ID with all details
  async getPhoneById(id) {
    const sql = `SELECT * FROM phones WHERE id = ?`;
    const phones = await query(sql, [id]);
    return phones[0] || null;
  }

  // Get all listings for a phone across marketplaces
  async getPhoneListings(phoneId) {
    const sql = `
      SELECT * FROM phones 
      WHERE (model, brand) = (
        SELECT model, brand FROM phones WHERE id = ?
      )
      ORDER BY marketplace_name, price
    `;
    
    return await query(sql, [phoneId]);
  }

  // Get price history for a phone
  async getPriceHistory(phoneId, days = 30) {
    const sql = `
      SELECT * FROM price_trends
      WHERE phone_id = ? 
      AND recorded_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      ORDER BY recorded_date ASC
    `;

    return await query(sql, [phoneId, days]);
  }

  // Get all brands
  async getBrands() {
    const sql = `
      SELECT brand, COUNT(*) as count
      FROM phones
      GROUP BY brand
      ORDER BY count DESC
    `;

    return await query(sql);
  }

  // Get price range
  async getPriceRange() {
    const sql = `
      SELECT 
        MIN(price) as minPrice,
        MAX(price) as maxPrice
      FROM phones
      WHERE price > 0
    `;

    const result = await query(sql);
    return result[0] || { minPrice: 0, maxPrice: 0 };
  }
}

module.exports = new PhoneService();
