const pool = require("../config/db");

const countRequestsInWindow = async (apiKeyId, windowStart) => {
  const query = `
    SELECT COUNT(*) 
    FROM usage_logs
    WHERE api_key_id = $1 AND created_at >= $2
  `;
  const result = await pool.query(query, [apiKeyId, windowStart]);
  return parseInt(result.rows[0].count, 10);
};

module.exports = {
  countRequestsInWindow,
};