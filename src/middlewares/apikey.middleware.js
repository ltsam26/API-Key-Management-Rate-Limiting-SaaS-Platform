const bcrypt = require("bcrypt");
const pool = require("../config/db");
const redisClient = require("../config/redis");
const { findKeyByHash, getAllActiveApiKeys } = require("../models/apikey.model");

const apiKeyMiddleware = async (req, res, next) => {
  try {
    const apiKey = req.headers["x-api-key"] || req.headers["authorization"]?.replace("Bearer ", "");
    if (!apiKey) return res.status(401).json({ message: "API key is missing" });

    // Optimization: Cache active keys or use findKeyByHash
    // For now, we compare against active keys to support multiple keys gracefully
    const activeKeys = await getAllActiveApiKeys();
    let validKey = null;

    for (const keyRecord of activeKeys) {
      const isMatch = await bcrypt.compare(apiKey, keyRecord.key_hash);
      if (isMatch) {
        // Fetch full details for the matched key
        validKey = await findKeyByHash(keyRecord.key_hash);
        break;
      }
    }

    if (!validKey) return res.status(403).json({ message: "Invalid API key" });

    // 1. Expiry Check
    if (validKey.expires_at && new Date(validKey.expires_at) < new Date()) {
      return res.status(403).json({ message: "API key has expired" });
    }

    // 2. IP Restriction Check
    const clientIp = req.ip || req.connection.remoteAddress;
    if (validKey.allowed_ips && validKey.allowed_ips.length > 0) {
      if (!validKey.allowed_ips.includes(clientIp)) {
        return res.status(403).json({ message: `IP access denied: ${clientIp}` });
      }
    }

    // 3. Rate Limit Check (Redis)
    const keyId = validKey.id;
    const rateLimitKey = `rate_limit:${keyId}`;
    const dailyQuotaKey = `quota:${keyId}:daily`;

    // Strategy: 10 req/min for free, higher for others
    const rpmLimit = validKey.plan === 'pro' ? 100 : (validKey.plan === 'basic' ? 30 : 10);
    const dailyLimit = validKey.plan === 'pro' ? 10000 : (validKey.plan === 'basic' ? 1000 : 100);

    // Check Minute Rate
    const currentRpm = await redisClient.incr(rateLimitKey);
    if (currentRpm === 1) await redisClient.expire(rateLimitKey, 60);
    if (currentRpm > rpmLimit) {
      return res.status(429).json({ message: "Rate limit exceeded (Requests per minute)" });
    }

    // Check Daily Quota
    const currentDaily = await redisClient.incr(dailyQuotaKey);
    if (currentDaily === 1) await redisClient.expire(dailyQuotaKey, 86400); // 1 day
    if (currentDaily > dailyLimit) {
      return res.status(429).json({ message: "Daily quota exceeded" });
    }

    // 4. Attach context
    req.apiKeyId = validKey.id;
    req.projectId = validKey.project_id;
    req.user = { id: validKey.user_id, plan: validKey.plan };

    // 5. Logging (Async)
    res.on("finish", async () => {
      try {
        await pool.query(
          `INSERT INTO api_logs (api_key_id, endpoint, method, ip_address, status_code)
           VALUES ($1, $2, $3, $4, $5)`,
          [validKey.id, req.originalUrl, req.method, clientIp, res.statusCode]
        );
        // Track last used
        await pool.query(`UPDATE api_keys SET last_used_at = NOW() WHERE id = $1`, [validKey.id]);
      } catch (err) {
        console.error("[Middleware] Log error:", err.message);
      }
    });

    next();
  } catch (error) {
    console.error("[API Key Middleware] Error:", error);
    res.status(500).json({ message: "Internal verification error" });
  }
};

module.exports = apiKeyMiddleware;