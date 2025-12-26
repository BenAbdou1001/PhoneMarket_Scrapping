const { query } = require('../database/connection');
const logger = require('../utils/logger');

class AnalyticsService {
  // Get marketplace statistics
  async getMarketplaceStats() {
    const sql = `
      SELECT 
        marketplace_name,
        total_listings,
        avg_price_smartphones,
        avg_price_tablets,
        avg_price_feature_phones,
        last_scraped_at,
        scrape_duration,
        scrape_success
      FROM marketplace_stats
      ORDER BY total_listings DESC
    `;

    const stats = await query(sql);

    // Get additional metrics
    for (const stat of stats) {
      // Get phone count per marketplace
      const phoneCount = await query(
        `SELECT COUNT(DISTINCT model, brand) as count 
         FROM phones 
         WHERE marketplace_name = ?`,
        [stat.marketplace_name]
      );
      stat.phone_count = phoneCount[0].count;

      // Get average price
      const avgPrice = await query(
        `SELECT AVG(price) as avg_price 
         FROM phones 
         WHERE marketplace_name = ? AND price > 0`,
        [stat.marketplace_name]
      );
      stat.avg_price = avgPrice[0].avg_price || 0;
    }

    return stats;
  }

  // Get trending phones (most listed recently)
  async getTrendingPhones(limit = 10) {
    // Ensure limit is a valid integer
    const validLimit = Number.isInteger(limit) ? limit : parseInt(limit) || 10;
    
    const sql = `
      SELECT 
        p.model,
        p.brand,
        p.category,
        COUNT(*) as listing_count,
        AVG(p.price) as avg_price,
        MIN(p.price) as min_price,
        MAX(p.price) as max_price,
        GROUP_CONCAT(DISTINCT p.marketplace_name) as marketplaces,
        MAX(p.scraped_at) as last_scraped
      FROM phones p
      WHERE p.scraped_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY p.model, p.brand, p.category
      ORDER BY listing_count DESC
      LIMIT ?
    `;

    console.log('getTrendingPhones - limit:', validLimit, 'type:', typeof validLimit);
    const result = await query(sql, [validLimit]);
    return result;
  }

  // Get price trends analysis
  async getPriceTrends(days = 30) {
    const sql = `
      SELECT 
        DATE(pt.recorded_date) as date,
        p.brand,
        p.category,
        AVG(pt.price) as avg_price,
        COUNT(*) as listing_count
      FROM price_trends pt
      JOIN phones p ON pt.phone_id = p.id
      WHERE pt.recorded_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(pt.recorded_date), p.brand, p.category
      ORDER BY date DESC, p.brand
    `;

    return await query(sql, [days]);
  }

  // Get popularity metrics
  async getPopularityMetrics(limit = 20) {
    const sql = `
      SELECT 
        p.id,
        p.model,
        p.brand,
        p.category,
        SUM(pp.total_listings) as total_listings,
        SUM(pp.stock_count) as total_stock,
        SUM(pp.views_count) as total_views,
        AVG(pp.popularity_score) as avg_popularity,
        GROUP_CONCAT(DISTINCT pp.marketplace_source) as marketplaces
      FROM phones p
      JOIN phone_populations pp ON p.id = pp.phone_id
      WHERE pp.recorded_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY p.id, p.model, p.brand, p.category
      ORDER BY total_listings DESC, avg_popularity DESC
      LIMIT ?
    `;

    return await query(sql, [limit]);
  }

  // Get category distribution
  async getCategoryDistribution() {
    const sql = `
      SELECT 
        category,
        marketplace_name,
        COUNT(*) as count,
        AVG(price) as avg_price
      FROM phones
      GROUP BY category, marketplace_name
      ORDER BY category, count DESC
    `;

    return await query(sql);
  }

  // Get brand distribution
  async getBrandDistribution() {
    const sql = `
      SELECT 
        brand,
        COUNT(*) as listing_count,
        COUNT(DISTINCT model) as model_count,
        AVG(price) as avg_price,
        MIN(price) as min_price,
        MAX(price) as max_price
      FROM phones
      WHERE price > 0
      GROUP BY brand
      ORDER BY listing_count DESC
    `;

    return await query(sql);
  }

  // Get stock level analysis
  async getStockAnalysis() {
    const sql = `
      SELECT 
        availability_status,
        marketplace_name,
        COUNT(*) as count
      FROM phones
      GROUP BY availability_status, marketplace_name
      ORDER BY marketplace_name, availability_status
    `;

    return await query(sql);
  }

  // Get daily scraping performance
  async getScrapingPerformance(days = 7) {
    const sql = `
      SELECT 
        DATE(created_at) as date,
        marketplace_name,
        log_level,
        COUNT(*) as count
      FROM scraping_logs
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(created_at), marketplace_name, log_level
      ORDER BY date DESC, marketplace_name
    `;

    return await query(sql, [days]);
  }

  // Get overall dashboard stats
  async getDashboardStats() {
    // Total phones
    const totalPhones = await query(
      `SELECT COUNT(DISTINCT model, brand) as count FROM phones`
    );

    // Total listings
    const totalListings = await query(
      `SELECT COUNT(*) as count FROM phones`
    );

    // Average price
    const avgPrice = await query(
      `SELECT AVG(price) as avg FROM phones WHERE price > 0`
    );

    // Price range
    const priceRange = await query(
      `SELECT MIN(price) as min, MAX(price) as max FROM phones WHERE price > 0`
    );

    // Marketplace count
    const marketplaceCount = await query(
      `SELECT COUNT(DISTINCT marketplace_name) as count FROM phones`
    );

    // Recent updates
    const recentUpdates = await query(
      `SELECT COUNT(*) as count FROM phones 
       WHERE scraped_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`
    );

    return {
      totalPhones: totalPhones[0].count,
      totalListings: totalListings[0].count,
      avgPrice: avgPrice[0].avg || 0,
      minPrice: priceRange[0].min || 0,
      maxPrice: priceRange[0].max || 0,
      marketplaceCount: marketplaceCount[0].count,
      recentUpdates: recentUpdates[0].count
    };
  }

  // Get phone comparison data
  async comparePhones(phoneIds) {
    const placeholders = phoneIds.map(() => '?').join(',');
    const sql = `
      SELECT 
        p.*,
        (SELECT AVG(price) FROM price_trends WHERE phone_id = p.id) as avg_historical_price,
        (SELECT COUNT(*) FROM price_trends WHERE phone_id = p.id) as price_history_count
      FROM phones p
      WHERE p.id IN (${placeholders})
    `;

    return await query(sql, phoneIds);
  }
}

module.exports = new AnalyticsService();
