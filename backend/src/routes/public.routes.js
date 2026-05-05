const express = require("express");
const router = express.Router();
const apiKeyMiddleware = require("../middlewares/apikey.middleware");
const rateLimitMiddleware = require("../middlewares/ratelimit.middleware");
const quotaMiddleware = require("../middlewares/quota.middleware");

router.get(
  "/data",
  apiKeyMiddleware,    // 1. Validate API Key + hydrate req.user
  quotaMiddleware,     // 2. Check daily quota (Redis) 
  rateLimitMiddleware, // 3. Check per-minute rate limit (in-memory)
  (req, res) => {
    res.status(200).json({
      message: "Public API accessed successfully using API Key",
      projectId: req.projectId,
      user: req.user,
      data: {
        info: "This is protected public data",
        timestamp: new Date(),
      },
    });
  }
);

module.exports = router;