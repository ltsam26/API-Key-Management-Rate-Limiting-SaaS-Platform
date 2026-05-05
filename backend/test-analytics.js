require('dotenv').config();
const pool = require('./src/config/db');
const { getProjectAnalytics } = require('./src/models/analytics.model');
const fs = require('fs');

async function run() {
  try {
    const loggedProject = await pool.query(`
      SELECT DISTINCT p.id, p.name 
      FROM projects p 
      JOIN api_keys ak ON ak.project_id = p.id
      JOIN usage_logs ul ON ul.api_key_id = ak.id
      LIMIT 1
    `);
    
    if (loggedProject.rows[0]) {
      const result = await getProjectAnalytics(loggedProject.rows[0].id);
      fs.writeFileSync('error.txt', 'SUCCESS', 'utf8');
    } else {
      fs.writeFileSync('error.txt', 'NO LOGS', 'utf8');
    }
  } catch (e) {
    fs.writeFileSync('error.txt', e.message + '\n' + e.stack, 'utf8');
  } finally {
    process.exit(0);
  }
}
run();
