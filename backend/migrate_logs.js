require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    await pool.query(`
      -- Table for aggregated usage
      CREATE TABLE IF NOT EXISTS api_usage (
        id SERIAL PRIMARY KEY,
        api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
        requests_count INTEGER DEFAULT 0,
        tokens_used INTEGER DEFAULT 0,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Detailed logs (renaming or replacing usage_logs)
      CREATE TABLE IF NOT EXISTS api_logs (
        id SERIAL PRIMARY KEY,
        api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
        endpoint TEXT,
        method TEXT,
        ip_address TEXT,
        status_code INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Ensure api_keys has necessary logic
      ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP;
      
      -- Indexing for performance
      CREATE INDEX IF NOT EXISTS idx_api_logs_key_id ON api_logs(api_key_id);
      CREATE INDEX IF NOT EXISTS idx_api_usage_key_id ON api_usage(api_key_id);
    `);
    console.log('API architecture tables created.');
  } catch(e) {
    console.error('Migration Error:', e.message);
  } finally {
    await pool.end();
  }
}

run();
