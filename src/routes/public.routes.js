const express = require("express");
const router = express.Router();
const apiKeyMiddleware = require("../middlewares/apikey.middleware");
const rateLimitMiddleware = require("../middlewares/ratelimit.middleware");

router.get(
  "/data",
  apiKeyMiddleware,
  rateLimitMiddleware,
  (req, res) => {
    res.status(200).json({
      message: "Public API accessed successfully using API Key",
      projectId: req.projectId,
      data: {
        info: "This is protected public data",
        timestamp: new Date(),
      },
    });
  }
);

module.exports = router;