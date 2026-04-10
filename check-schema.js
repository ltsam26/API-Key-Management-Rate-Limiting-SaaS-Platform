require('dotenv').config();
const pool = require('./src/config/db');
pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='usage_logs' ORDER BY ordinal_position")
  .then(r => console.log('Columns:', r.rows.map(c => c.column_name)))
  .catch(e => console.error('ERR:', e.message))
  .finally(() => process.exit(0));
