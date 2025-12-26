const express = require('express');
const router = express.Router();
const phoneService = require('../services/phoneService');
const { validate } = require('../middleware/validation');

// Get all phones with filters
router.get('/', validate('getPhones'), async (req, res, next) => {
  try {
    const phones = await phoneService.getPhones(req.query);
    
    res.json({
      success: true,
      count: phones.length,
      data: phones
    });
  } catch (error) {
    next(error);
  }
});

// Get phone by ID
router.get('/:id', async (req, res, next) => {
  try {
    const phone = await phoneService.getPhoneById(req.params.id);
    
    if (!phone) {
      return res.status(404).json({
        success: false,
        error: 'Phone not found'
      });
    }

    res.json({
      success: true,
      data: phone
    });
  } catch (error) {
    next(error);
  }
});

// Get all listings for a phone
router.get('/:id/listings', async (req, res, next) => {
  try {
    const listings = await phoneService.getPhoneListings(req.params.id);
    
    res.json({
      success: true,
      count: listings.length,
      data: listings
    });
  } catch (error) {
    next(error);
  }
});

// Get price history for a phone
router.get('/:id/price-history', async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const history = await phoneService.getPriceHistory(req.params.id, days);
    
    res.json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    next(error);
  }
});

// Get all brands
router.get('/meta/brands', async (req, res, next) => {
  try {
    const brands = await phoneService.getBrands();
    
    res.json({
      success: true,
      data: brands
    });
  } catch (error) {
    next(error);
  }
});

// Get price range
router.get('/meta/price-range', async (req, res, next) => {
  try {
    const range = await phoneService.getPriceRange();
    
    res.json({
      success: true,
      data: range
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
