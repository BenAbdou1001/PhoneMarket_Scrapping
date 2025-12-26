const fs = require('fs');
const path = require('path');
const { getConnection } = require('./connection');

const runMigrations = async () => {
  const connection = await getConnection();
  const migrationsDir = path.join(__dirname, 'migrations');
  
  try {
    // Create migrations tracking table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Get list of migration files
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    console.log(`Found ${files.length} migration files`);
    
    for (const file of files) {
      // Check if migration already executed
      const [rows] = await connection.execute(
        'SELECT * FROM migrations WHERE name = ?',
        [file]
      );
      
      if (rows.length > 0) {
        console.log(`Skipping ${file} (already executed)`);
        continue;
      }
      
      // Read and execute migration
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      const statements = sql.split(';').filter(s => s.trim());
      
      console.log(`Executing ${file}...`);
      
      for (const statement of statements) {
        if (statement.trim()) {
          await connection.execute(statement);
        }
      }
      
      // Record migration
      await connection.execute(
        'INSERT INTO migrations (name) VALUES (?)',
        [file]
      );
      
      console.log(`✓ ${file} completed`);
    }
    
    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  } finally {
    await connection.end();
  }
};

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Migrations finished');
      process.exit(0);
    })
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigrations };
