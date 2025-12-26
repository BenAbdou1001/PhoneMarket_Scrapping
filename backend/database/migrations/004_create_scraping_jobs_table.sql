-- Create scraping_jobs table
CREATE TABLE IF NOT EXISTS scraping_jobs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  job_id VARCHAR(100) NOT NULL UNIQUE,
  marketplace_name ENUM('ouedkniss', 'jumia', 'facebook') NOT NULL,
  schedule_frequency INT NOT NULL COMMENT 'Frequency in hours',
  last_run TIMESTAMP NULL,
  next_run TIMESTAMP NULL,
  status ENUM('idle', 'running', 'completed', 'failed') DEFAULT 'idle',
  error_message TEXT,
  items_scraped INT DEFAULT 0,
  duration INT DEFAULT 0 COMMENT 'Duration in seconds',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_marketplace (marketplace_name),
  INDEX idx_status (status),
  INDEX idx_next_run (next_run)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
