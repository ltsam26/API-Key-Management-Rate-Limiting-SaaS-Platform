const pool = require('./src/config/db');
const PLANS = { FREE: 2, BASIC: 5, PRO: 20, ENTERPRISE: 100 };

async function fix() {
  try {
    const res = await pool.query('SELECT id, plan FROM projects');
    console.log(`Found ${res.rows.length} projects to check.`);
    
    for (const p of res.rows) {
      const planName = (p.plan || 'FREE').toUpperCase();
      const limit = PLANS[planName] || 5;
      
      console.log(`Setting project ${p.id} (${planName}) limit to ${limit}`);
      await pool.query('UPDATE projects SET max_api_keys = $1 WHERE id = $2', [limit, p.id]);
    }
    
    console.log('Fixed all existing project limits successfully!');
    process.exit(0);
  } catch(e) {
    console.error('Error fixing limits:', e.message);
    process.exit(1);
  }
}

fix();
