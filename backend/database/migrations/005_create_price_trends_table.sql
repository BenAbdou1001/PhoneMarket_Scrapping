-- Create price_trends table
CREATE TABLE IF NOT EXISTS price_trends (
  id INT PRIMARY KEY AUTO_INCREMENT,
  phone_id INT NOT NULL,
  marketplace_name ENUM('ouedkniss', 'jumia', 'facebook') NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  availability_count INT DEFAULT 1,
  recorded_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (phone_id) REFERENCES phones(id) ON DELETE CASCADE,
  INDEX idx_phone_id (phone_id),
  INDEX idx_marketplace (marketplace_name),
  INDEX idx_recorded_date (recorded_date),
  INDEX idx_phone_marketplace (phone_id, marketplace_name),
  UNIQUE KEY unique_phone_marketplace_date (phone_id, marketplace_name, recorded_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
