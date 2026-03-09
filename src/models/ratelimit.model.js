const pool = require("../config/db");
const { countRequestsInWindow } = require("../models/ratelimit.model");

const rateLimitMiddleware = async (req, res, next) => {
  try {
    const apiKeyId = req.apiKeyId;

    const limitResult = await pool.query(
      `SELECT rate_limit_per_minute FROM api_keys WHERE id = $1`,
      [apiKeyId]
    );

    const limit = limitResult.rows[0].rate_limit_per_minute;

    const windowStart = new Date(Date.now() - 60 * 1000);

    const requestCount = await countRequestsInWindow(apiKeyId, windowStart);

    if (requestCount >= limit) {
      return res.status(429).json({
        message: "Rate limit exceeded"
      });
    }

    next();

  } catch (error) {
    res.status(500).json({
      message: "Rate limit check failed",
      error: error.message
    });
  }
};

module.exports = rateLimitMiddleware;