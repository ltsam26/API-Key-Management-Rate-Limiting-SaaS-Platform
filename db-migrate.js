require('dotenv').config();
const pool = require('./src/config/db');

async function migrate() {
  try {
    // 1. Roles
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user'");
    
    // Promote first user to admin
    await pool.query("UPDATE users SET role = 'admin' WHERE email = 'test_new@example.com'");
    // Wait, let's just make the oldest user the admin.
    await pool.query("UPDATE users SET role = 'admin' WHERE id = (SELECT id FROM users ORDER BY created_at ASC LIMIT 1)");

    // 2. Subscriptions Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        plan_type VARCHAR(20) DEFAULT 'FREE',
        status VARCHAR(20) DEFAULT 'active',
        stripe_customer_id VARCHAR(100),
        stripe_subscription_id VARCHAR(100),
        expires_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 3. Projects Plan
    await pool.query("ALTER TABLE projects ADD COLUMN IF NOT EXISTS plan VARCHAR(20) DEFAULT 'FREE'");
    
    console.log("Migration complete!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

migrate();
