#!/usr/bin/env node

const aiService = require('../services/AIService');
const db = require('../database/connection');
const logger = require('../utils/logger');

async function cleanData(options = {}) {
  const {
    marketplace = 'ouedkniss',
    limit = 100,
    dryRun = false
  } = options;

  logger.info('=== Starting AI Data Cleaning ===');
  logger.info(`Marketplace: ${marketplace}`);
  logger.info(`Limit: ${limit}`);
  logger.info(`Dry Run: ${dryRun}`);

  try {
    // Check Ollama availability
    const isOllamaAvailable = await aiService.checkOllamaAvailability();
    if (!isOllamaAvailable) {
      logger.warn('⚠️  Ollama not available. Using fallback rule-based categorization.');
      logger.info('To use AI: Install Ollama from https://ollama.ai and run: ollama pull llama3.2:3b');
    } else {
      logger.info('✅ Ollama is available. Using AI for data cleaning.');
    }

    // Fetch products from Ouedkniss
    const query = marketplace === 'all'
      ? 'SELECT * FROM phones ORDER BY created_at DESC LIMIT ?'
      : 'SELECT * FROM phones WHERE marketplace_name = ? ORDER BY created_at DESC LIMIT ?';
    
    const params = marketplace === 'all' ? [limit] : [marketplace, limit];
    const products = await db.query(query, params);

    logger.info(`\n📊 Found ${products.length} products to analyze\n`);

    if (products.length === 0) {
      logger.warn('No products found to clean');
      return;
    }

    let processed = 0;
    let updated = 0;
    let categorized = 0;
    let priceIssues = 0;
    let brandUpdates = 0;

    // Analyze each product
    for (const product of products) {
      try {
        const analysis = await aiService.analyzeWithFallback(product);
        
        if (!analysis) {
          logger.warn(`No analysis for product ${product.id}: ${product.model}`);
          processed++;
          continue;
        }

        let needsUpdate = false;
        const updates = [];
        const values = [];

        // Check category change
        if (analysis.category !== product.category) {
          updates.push('category = ?');
          values.push(analysis.category);
          needsUpdate = true;
          categorized++;
          logger.info(`  [${product.id}] Category: ${product.category} -> ${analysis.category}`);
        }

        // Check brand update
        if (analysis.brand !== 'Unknown' && analysis.brand !== product.brand) {
          updates.push('brand = ?');
          values.push(analysis.brand);
          needsUpdate = true;
          brandUpdates++;
          logger.info(`  [${product.id}] Brand: ${product.brand} -> ${analysis.brand}`);
        }

        // Check price validity
        if (!analysis.isValidPrice) {
          priceIssues++;
          logger.warn(`  [${product.id}] ⚠️  Invalid price: ${product.price} DZD - ${analysis.priceReason}`);
          
          // Mark as out of stock or set availability flag
          if (product.availability_status !== 'out_of_stock') {
            updates.push('availability_status = ?');
            values.push('out_of_stock');
            needsUpdate = true;
          }
        }

        // Update cleaned title if improved
        if (analysis.cleanedTitle && analysis.cleanedTitle !== product.model) {
          const cleanedTitle = analysis.cleanedTitle.trim();
          if (cleanedTitle.length > 3 && cleanedTitle.length < 255) {
            updates.push('model = ?');
            values.push(cleanedTitle);
            needsUpdate = true;
          }
        }

        // Perform update
        if (needsUpdate && !dryRun) {
          updates.push('updated_at = NOW()');
          values.push(product.id);
          
          const updateQuery = `UPDATE phones SET ${updates.join(', ')} WHERE id = ?`;
          await db.query(updateQuery, values);
          updated++;
        } else if (needsUpdate && dryRun) {
          logger.info(`  [${product.id}] Would update: ${updates.join(', ')}`);
          updated++;
        }

        processed++;
        
        // Progress indicator
        if (processed % 10 === 0) {
          logger.info(`\n📈 Progress: ${processed}/${products.length} products analyzed\n`);
        }

      } catch (error) {
        logger.error(`Error processing product ${product.id}:`, error.message);
        processed++;
      }
    }

    // Summary
    logger.info('\n=== Cleaning Summary ===');
    logger.info(`📊 Total processed: ${processed}`);
    logger.info(`✅ Updates applied: ${updated}`);
    logger.info(`🏷️  Re-categorized: ${categorized}`);
    logger.info(`🏢 Brand updates: ${brandUpdates}`);
    logger.info(`⚠️  Price issues found: ${priceIssues}`);
    
    if (dryRun) {
      logger.info('\n⚠️  DRY RUN MODE - No changes were saved to database');
      logger.info('Run without --dry-run to apply changes');
    }

  } catch (error) {
    logger.error('Data cleaning failed:', error);
  } finally {
    process.exit(0);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  marketplace: 'ouedkniss',
  limit: 100,
  dryRun: false
};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--marketplace' || arg === '-m') {
    options.marketplace = args[++i];
  } else if (arg === '--limit' || arg === '-l') {
    options.limit = parseInt(args[++i]);
  } else if (arg === '--dry-run' || arg === '-d') {
    options.dryRun = true;
  } else if (arg === '--all' || arg === '-a') {
    options.marketplace = 'all';
  }
}

cleanData(options);
