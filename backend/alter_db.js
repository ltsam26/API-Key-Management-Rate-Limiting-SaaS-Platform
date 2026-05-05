require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS api_key_security (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
        allowed_ips TEXT[] DEFAULT '{}',
        blocked_ips TEXT[] DEFAULT '{}',
        UNIQUE(api_key_id)
      );
      ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS name VARCHAR(255) DEFAULT 'Default Key';
      ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '["all"]';
      ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;
    `);
    console.log('Schema updated successfully.');
  } catch(e) {
    console.error('DB Error:', e.message);
  } finally {
    await pool.end();
  }
}

run();
