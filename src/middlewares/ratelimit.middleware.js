const { countRequestsInWindow } = require("../models/ratelimit.model");

const rateLimitMiddleware = async (req, res, next) => {
  try {
    const apiKeyId = req.apiKeyId;

    if (!apiKeyId) {
      return res.status(500).json({ message: "API key context missing" });
    }

    // 1 minute time window
    const windowStart = new Date(Date.now() - 60 * 1000);

    const requestCount = await countRequestsInWindow(apiKeyId, windowStart);

    // Default limit (can be dynamic later)
    const MAX_REQUESTS = 10;

    if (requestCount >= MAX_REQUESTS) {
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