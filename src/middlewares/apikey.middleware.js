const bcrypt = require("bcrypt");
const { getAllActiveApiKeys } = require("../models/apikey.model");
const { createUsageLog } = require("../models/usage.model");

const apiKeyMiddleware = async (req, res, next) => {
  try {
    const apiKey = req.headers["x-api-key"];

    if (!apiKey) {
      return res.status(401).json({ message: "API key is missing" });
    }

    const activeKeys = await getAllActiveApiKeys();

    let validKey = null;

    for (const keyRecord of activeKeys) {
      const isMatch = await bcrypt.compare(apiKey, keyRecord.key_hash);
      if (isMatch) {
        validKey = keyRecord;
        break;
      }
    }

    if (!validKey) {
      return res.status(403).json({ message: "Invalid API key" });
    }
    req.projectId = validKey.project_id;
    req.apiKeyId = validKey.id;

    // Log after response finishes
    res.on("finish", async () => {
      try {
        await createUsageLog(
          validKey.id,
          req.originalUrl,
          req.method,
          res.statusCode
        );
      } catch (err) {
        console.error("Logging failed:", err.message);
      }
    });

    next();
  } catch (error) {
    res.status(500).json({
      message: "API key verification failed",
      error: error.message,
    });
  }
};

module.exports = apiKeyMiddleware;