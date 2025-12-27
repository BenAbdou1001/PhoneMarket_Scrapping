const axios = require('axios');
const logger = require('../utils/logger');

class AIService {
  constructor() {
    this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.model = process.env.OLLAMA_MODEL || 'llama3.2:3b';
  }

  async checkOllamaAvailability() {
    try {
      const response = await axios.get(`${this.ollamaUrl}/api/tags`, { timeout: 2000 });
      return response.status === 200;
    } catch (error) {
      // Silently return false, will be logged once at script start
      return false;
    }
  }

  async analyzeProduct(product) {
    try {
      const prompt = `Analyze this product listing and provide a JSON response with the following fields:
      
Product Title: ${product.model || product.title}
Price: ${product.price} DZD
Brand: ${product.brand || 'Unknown'}
Current Category: ${product.category || 'Unknown'}

Provide analysis in this exact JSON format:
{
  "category": "smartphone|tablet|feature_phone|accessory|display|laptop|other",
  "brand": "actual brand name or Unknown",
  "isValidPrice": true or false,
  "priceReason": "reason if price is invalid",
  "cleanedTitle": "cleaned product name",
  "confidence": 0.0 to 1.0
}

Rules:
- Valid categories ONLY: smartphone, tablet, feature_phone, accessory, display, laptop, other
- If it's a screen/display/écran, category is "display"
- If it's earbuds/case/charger/cable/buds, category is "accessory"
- If it's a laptop/MacBook/PC, category is "laptop"
- If price is 1 DZD or 1000000+ DZD, it's invalid
- If price is suspiciously low for the product type, mark as invalid
- Common Algerian phone brands: Samsung, iPhone/Apple, Xiaomi, Oppo, Realme, Tecno, Infinix
- Extract actual brand from title (e.g., "Samsung Galaxy S23" -> Samsung)
- For accessories, extract brand (e.g., "Samsung Buds" -> Samsung, "Anker charger" -> Anker)
- Clean title by removing extra spaces, fixing typos, removing store names

Respond with ONLY the JSON, no extra text.`;

      const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: this.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.1,
          top_p: 0.9
        }
      });

      const aiResponse = response.data.response;
      
      // Try to extract JSON from response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.warn('AI response did not contain valid JSON:', aiResponse);
        return null;
      }

      const analysis = JSON.parse(jsonMatch[0]);
      
      // Validate category
      const validCategories = ['smartphone', 'tablet', 'feature_phone', 'accessory', 'display', 'laptop', 'other'];
      if (!validCategories.includes(analysis.category)) {
        analysis.category = 'other';
      }
      
      return analysis;
    } catch (error) {
      logger.error('Error analyzing product with AI:', error.message);
      return null;
    }
  }

  async batchAnalyzeProducts(products, onProgress) {
    const results = [];
    const total = products.length;

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      try {
        const analysis = await this.analyzeProduct(product);
        results.push({
          id: product.id,
          original: product,
          analysis: analysis
        });

        if (onProgress) {
          onProgress(i + 1, total);
        }

        // Small delay to not overwhelm Ollama
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        logger.error(`Error analyzing product ${product.id}:`, error.message);
        results.push({
          id: product.id,
          original: product,
          analysis: null
        });
      }
    }

    return results;
  }

  // Fallback rule-based categorization when AI is not available
  fallbackCategorization(product) {
    const title = (product.model || product.title || '').toLowerCase();
    const price = parseFloat(product.price) || 0;

    let category = product.category || 'smartphone';
    let isValidPrice = true;
    let priceReason = '';

    // Category detection
    if (title.includes('écran') || title.includes('screen') || title.includes('display') || 
        title.includes('afficheur') || title.includes('lcd')) {
      category = 'display';
    } else if (title.includes('laptop') || title.includes('macbook') || title.includes('pc portable') ||
               title.includes('ordinateur')) {
      category = 'laptop';
    } else if (title.includes('tablet') || title.includes('tablette') || title.includes('ipad')) {
      category = 'tablet';
    } else if (title.includes('buds') || title.includes('ecouteur') || title.includes('earphone') ||
               title.includes('case') || title.includes('coque') || title.includes('charger') ||
               title.includes('cable') || title.includes('câble') || title.includes('protection') ||
               title.includes('chargeur')) {
      category = 'accessory';
    }

    // Price validation
    if (price <= 1 || price >= 1000000) {
      isValidPrice = false;
      priceReason = 'Price is unrealistic (too low or too high)';
    } else if (category === 'smartphone' && price < 5000) {
      isValidPrice = false;
      priceReason = 'Price too low for a smartphone';
    } else if (category === 'tablet' && price < 10000) {
      isValidPrice = false;
      priceReason = 'Price too low for a tablet';
    } else if (category === 'laptop' && price < 50000) {
      isValidPrice = false;
      priceReason = 'Price too low for a laptop';
    }

    // Brand extraction
    let brand = product.brand || 'Unknown';
    const brands = ['samsung', 'iphone', 'apple', 'xiaomi', 'oppo', 'realme', 'tecno', 
                    'infinix', 'huawei', 'honor', 'nokia', 'motorola', 'oneplus', 'vivo',
                    'anker', 'boya', 'jbl', 'sony', 'lg', 'dell', 'hp', 'lenovo', 'asus'];
    
    for (const b of brands) {
      if (title.includes(b)) {
        brand = b.charAt(0).toUpperCase() + b.slice(1);
        if (b === 'iphone') brand = 'Apple';
        break;
      }
    }

    return {
      category,
      brand,
      isValidPrice,
      priceReason,
      cleanedTitle: product.model || product.title,
      confidence: 0.7
    };
  }

  async analyzeWithFallback(product) {
    const isAvailable = await this.checkOllamaAvailability();
    
    if (isAvailable) {
      const aiAnalysis = await this.analyzeProduct(product);
      if (aiAnalysis) {
        return aiAnalysis;
      }
    }

    // Fallback to rule-based
    return this.fallbackCategorization(product);
  }
}

module.exports = new AIService();
