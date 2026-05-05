// Quota Middleware — Redis-backed daily usage limits by plan tier
const redisClient = require("../config/redis");

const quotaMap = {
  FREE: 100,
  BASIC: 1000,
  PRO: 10000,
  ENTERPRISE: 100000
};

const quotaMiddleware = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(500).json({ message: "User context missing for quota check" });
    }

    const { id, plan } = req.user;
    const activePlan = (plan && quotaMap[plan.toUpperCase()]) ? plan.toUpperCase() : "FREE";
    const dailyQuotaLimit = quotaMap[activePlan];

    const redisKey = `quota:${id}`;
    const ttlKey = `quota:${id}:ttl_set`;

    // Check if already locked out (exceeded key exists)
    const isLocked = await redisClient.exists(`quota:${id}:locked`);
    if (isLocked) {
      const ttl = await redisClient.ttl(`quota:${id}:locked`);
      return res.status(429).json({
        message: "Quota exceeded",
        resetIn: `${Math.floor(ttl / 3600)}h ${Math.floor((ttl % 3600) / 60)}m`,
      });
    }

    // Increment usage counter
    const currentUsage = await redisClient.incr(redisKey);

    res.setHeader('X-Quota-Limit', dailyQuotaLimit);
    res.setHeader('X-Quota-Remaining', Math.max(0, dailyQuotaLimit - currentUsage));

    if (currentUsage > dailyQuotaLimit) {
      // Lock out this user for 24 hours from moment of first breach
      await redisClient.set(`quota:${id}:locked`, '1', { EX: 86400 });
      // Also clean up counter
      await redisClient.del(redisKey);

      return res.status(429).json({
        message: "Quota exceeded",
        resetIn: "24h 0m",
      });
    }

    next();
  } catch (error) {
    console.error("Quota check failed:", error.message);
    // Fail-open: allow request if Redis is temporarily unavailable
    next();
  }
};

module.exports = quotaMiddleware;
