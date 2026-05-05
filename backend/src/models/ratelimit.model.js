const pool = require("../config/db");

const countRequestsInWindow = async (apiKeyId) => {
  const query = `
    SELECT COUNT(*) 
    FROM api_logs
    WHERE api_key_id = $1 AND created_at >= NOW() - INTERVAL '1 minute'
  `;

  const result = await pool.query(query, [apiKeyId]);

  return parseInt(result.rows[0].count, 10);
};

module.exports = {
  countRequestsInWindow
};