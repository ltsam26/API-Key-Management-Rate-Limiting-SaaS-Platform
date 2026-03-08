const pool = require("../config/db");
const { countRequestsInWindow } = require("../models/ratelimit.model");

const rateLimitMiddleware = async (req, res, next) => {
  try {
    const apiKeyId = req.apiKeyId;
    const projectId = req.projectId;

    if (!apiKeyId || !projectId) {
      return res.status(500).json({ message: "API key context missing" });
    }

    // 1 minute time window
    const windowStart = new Date(Date.now() - 60 * 1000);

    const requestCount = await countRequestsInWindow(apiKeyId, windowStart);

    // 🔹 Fetch project-specific rate limit
    const limitResult = await pool.query(
      `SELECT rate_limit_per_minute FROM projects WHERE id = $1`,
      [projectId]
    );

    const rateLimit = limitResult.rows[0].rate_limit_per_minute;

    if (requestCount >= rateLimit) {
      return res.status(429).json({
        message: "Rate limit exceeded. Try again later.",
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      message: "Rate limit check failed",
      error: error.message,
    });
  }
};

module.exports = rateLimitMiddleware;