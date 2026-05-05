const pool = require('../config/db') // adjust path to your db connection

async function migrate() {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS role VARCHAR(10) DEFAULT 'user'
    `)
    console.log('✅ Added role column')

    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS plan VARCHAR(20) DEFAULT 'free'
    `)
    console.log('✅ Added plan column')

    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255)
    `)
    console.log('✅ Added stripe_customer_id column')

    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP
    `)
    console.log('✅ Added plan_expires_at column')

    await client.query('COMMIT')
    console.log('✅ Migration complete')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ Migration failed:', err.message)
  } finally {
    client.release()
    process.exit(0)
  }
}

migrate()