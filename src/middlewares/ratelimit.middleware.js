const pool = require("../config/db");
const { countRequestsInWindow } = require("../models/ratelimit.model");

const localRequestCache = new Map();

const rateLimitMiddleware = async (req, res, next) => {
  try {
    const apiKeyId = req.apiKeyId;

    if (!apiKeyId) {
      return res.status(500).json({ message: "API key context missing" });
    }

    const limitResult = await pool.query(
      `SELECT p.plan FROM api_keys a JOIN projects p ON a.project_id = p.id WHERE a.id = $1`,
      [apiKeyId]
    );

    const plan = limitResult.rows[0]?.plan || 'FREE';
    const rateLimit = plan === 'ENTERPRISE' ? 1000 : plan === 'PRO' ? 100 : 10;

    const now = Date.now();
    if (!localRequestCache.has(apiKeyId)) {
        const dbCount = await countRequestsInWindow(apiKeyId);
        localRequestCache.set(apiKeyId, { count: dbCount, windowStart: now });
    }

    const cache = localRequestCache.get(apiKeyId);
    if (now - cache.windowStart > 60000) {
        const dbCount = await countRequestsInWindow(apiKeyId);
        cache.count = dbCount; 
        cache.windowStart = now;
    }

    cache.count++;
    
    const requestCount = cache.count;
    const remaining = Math.max(0, rateLimit - requestCount);

    res.setHeader('X-RateLimit-Limit', rateLimit);
    res.setHeader('X-RateLimit-Remaining', remaining);

    if (requestCount > rateLimit) {
      cache.count--; // Refund if rejected
      return res.status(429).json({
        message: "You exceeded your current quota, please check your plan and billing details.",
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