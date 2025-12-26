const express = require('express');
const router = express.Router();
const analyticsService = require('../services/analyticsService');

// Get marketplace statistics
router.get('/marketplace-stats', async (req, res, next) => {
  try {
    const stats = await analyticsService.getMarketplaceStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

// Get trending phones
router.get('/trending', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const trending = await analyticsService.getTrendingPhones(limit);
    
    res.json({
      success: true,
      count: trending.length,
      data: trending
    });
  } catch (error) {
    next(error);
  }
});

// Get price trends
router.get('/price-trends', async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const trends = await analyticsService.getPriceTrends(days);
    
    res.json({
      success: true,
      count: trends.length,
      data: trends
    });
  } catch (error) {
    next(error);
  }
});

// Get popularity metrics
router.get('/popularity', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const metrics = await analyticsService.getPopularityMetrics(limit);
    
    res.json({
      success: true,
      count: metrics.length,
      data: metrics
    });
  } catch (error) {
    next(error);
  }
});

// Get category distribution
router.get('/category-distribution', async (req, res, next) => {
  try {
    const distribution = await analyticsService.getCategoryDistribution();
    
    res.json({
      success: true,
      data: distribution
    });
  } catch (error) {
    next(error);
  }
});

// Get brand distribution
router.get('/brand-distribution', async (req, res, next) => {
  try {
    const distribution = await analyticsService.getBrandDistribution();
    
    res.json({
      success: true,
      data: distribution
    });
  } catch (error) {
    next(error);
  }
});

// Get stock analysis
router.get('/stock-analysis', async (req, res, next) => {
  try {
    const analysis = await analyticsService.getStockAnalysis();
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    next(error);
  }
});

// Get scraping performance
router.get('/scraping-performance', async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const performance = await analyticsService.getScrapingPerformance(days);
    
    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    next(error);
  }
});

// Get dashboard stats
router.get('/dashboard-stats', async (req, res, next) => {
  try {
    const stats = await analyticsService.getDashboardStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

// Compare phones
router.get('/compare', async (req, res, next) => {
  try {
    const ids = req.query.ids ? req.query.ids.split(',').map(id => parseInt(id)) : [];
    
    if (ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No phone IDs provided'
      });
    }

    const comparison = await analyticsService.comparePhones(ids);
    
    res.json({
      success: true,
      count: comparison.length,
      data: comparison
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
