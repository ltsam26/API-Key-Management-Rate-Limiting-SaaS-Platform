const pool = require("../config/db");

const getSystemStats = async (req, res) => {
  try {

    const users = await pool.query(`SELECT COUNT(*) FROM users`);
    const projects = await pool.query(`SELECT COUNT(*) FROM projects`);
    const apiKeys = await pool.query(`SELECT COUNT(*) FROM api_keys`);
    const apiCalls = await pool.query(`SELECT COUNT(*) FROM usage_logs`);

    res.status(200).json({
      system: "API Platform",
      stats: {
        users: parseInt(users.rows[0].count),
        projects: parseInt(projects.rows[0].count),
        apiKeys: parseInt(apiKeys.rows[0].count),
        apiCalls: parseInt(apiCalls.rows[0].count)
      }
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch system stats",
      error: error.message
    });
  }
};

module.exports = {
  getSystemStats
};