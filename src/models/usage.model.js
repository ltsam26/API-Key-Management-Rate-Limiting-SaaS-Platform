const pool = require("../config/db");

const createUsageLog = async (apiKeyId, endpoint, method, statusCode) => {
  const query = `
    INSERT INTO api_logs (api_key_id, endpoint, method, status_code)
    VALUES ($1, $2, $3, $4)
  `;
  const values = [apiKeyId, endpoint, method, statusCode];
  await pool.query(query, values);
};

module.exports = {
  createUsageLog,
};