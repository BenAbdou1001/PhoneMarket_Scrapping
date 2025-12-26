-- Create scraping_logs table
CREATE TABLE IF NOT EXISTS scraping_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  job_id VARCHAR(100),
  marketplace_name ENUM('ouedkniss', 'jumia', 'facebook') NOT NULL,
  log_level ENUM('info', 'warning', 'error') DEFAULT 'info',
  message TEXT NOT NULL,
  details JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_job_id (job_id),
  INDEX idx_marketplace (marketplace_name),
  INDEX idx_log_level (log_level),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
