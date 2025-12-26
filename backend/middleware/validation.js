const Joi = require('joi');

// Validation schemas
const schemas = {
  getPhones: Joi.object({
    brand: Joi.string().allow('').optional(),
    category: Joi.string().valid('smartphone', 'tablet', 'feature_phone', 'accessory').allow('').optional(),
    marketplace: Joi.string().valid('ouedkniss', 'jumia', 'facebook').allow('').optional(),
    condition: Joi.string().valid('new', 'like_new', 'used', 'for_parts').allow('').optional(),
    minPrice: Joi.alternatives().try(Joi.number().min(0), Joi.string().allow('')).optional(),
    maxPrice: Joi.alternatives().try(Joi.number().min(0), Joi.string().allow('')).optional(),
    availability: Joi.string().valid('in_stock', 'limited_stock', 'out_of_stock').allow('').optional(),
    search: Joi.string().allow('').optional(),
    sortBy: Joi.string().valid('price', 'created_at', 'listing_count', 'brand', 'model').allow('').optional(),
    sortOrder: Joi.string().valid('ASC', 'DESC').allow('').optional(),
    limit: Joi.alternatives().try(Joi.number().min(1).max(100), Joi.string().allow('')).optional(),
    offset: Joi.alternatives().try(Joi.number().min(0), Joi.string().allow('')).optional()
  }),

  updateSchedule: Joi.object({
    hours: Joi.number().min(1).max(24).required()
  })
};

// Validation middleware
const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    
    if (!schema) {
      return next();
    }

    const { error } = schema.validate(req.query || req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        error: 'Validation Error',
        details: errors
      });
    }

    next();
  };
};

module.exports = { validate, schemas };
