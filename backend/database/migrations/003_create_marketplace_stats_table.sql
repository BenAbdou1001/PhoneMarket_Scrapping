-- Create marketplace_stats table
CREATE TABLE IF NOT EXISTS marketplace_stats (
  id INT PRIMARY KEY AUTO_INCREMENT,
  marketplace_name ENUM('ouedkniss', 'jumia', 'facebook') NOT NULL UNIQUE,
  total_listings INT DEFAULT 0,
  avg_price_smartphones DECIMAL(10, 2) DEFAULT 0,
  avg_price_tablets DECIMAL(10, 2) DEFAULT 0,
  avg_price_feature_phones DECIMAL(10, 2) DEFAULT 0,
  last_scraped_at TIMESTAMP NULL,
  scrape_duration INT DEFAULT 0,
  scrape_success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_marketplace (marketplace_name),
  INDEX idx_last_scraped (last_scraped_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
