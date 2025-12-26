-- Create phone_populations table
CREATE TABLE IF NOT EXISTS phone_populations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  phone_id INT NOT NULL,
  total_listings INT DEFAULT 0,
  stock_count INT DEFAULT 0,
  views_count INT DEFAULT 0,
  favorites_count INT DEFAULT 0,
  popularity_score DECIMAL(10, 2) DEFAULT 0,
  marketplace_source ENUM('ouedkniss', 'jumia', 'facebook') NOT NULL,
  recorded_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (phone_id) REFERENCES phones(id) ON DELETE CASCADE,
  INDEX idx_phone_id (phone_id),
  INDEX idx_marketplace (marketplace_source),
  INDEX idx_recorded_date (recorded_date),
  INDEX idx_popularity (popularity_score),
  UNIQUE KEY unique_phone_marketplace_date (phone_id, marketplace_source, recorded_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
