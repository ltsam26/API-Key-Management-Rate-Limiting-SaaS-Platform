const pool = require("../config/db");

const createUsageLog = async (apiKeyId, endpoint, method) => {
  const query = `
    INSERT INTO usage_logs (api_key_id, endpoint, method)
    VALUES ($1, $2, $3)
  `;
  const values = [apiKeyId, endpoint, method];
  await pool.query(query, values);
};

module.exports = {
  createUsageLog,
};