const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const {
  generateApiKey,
  listUserApiKeys,
  revokeKey,
  rotateKey,
  setKeySecurity,
  setKeySettings,
  getLogs,
  getUsage
} = require("../controllers/apikey.controller");

// Key Management APIs
router.post("/create", authMiddleware, generateApiKey); // Aliased as create
router.post("/generate", authMiddleware, generateApiKey); // For backwards compatibility
router.get("/list", authMiddleware, listUserApiKeys);
router.post("/revoke/:keyId", authMiddleware, revokeKey); // POST as per user requirement, previously was PATCH
router.post("/rotate/:keyId", authMiddleware, rotateKey);

// Security APIs
router.post("/:keyId/set-ip-restriction", authMiddleware, setKeySecurity);
router.post("/:keyId/set-permissions", authMiddleware, setKeySettings);
router.post("/:keyId/set-expiry", authMiddleware, setKeySettings); // handled by same method

// Analytics & Logs
router.get("/:keyId/usage", authMiddleware, getUsage);
router.get("/:keyId/logs", authMiddleware, getLogs);
router.get("/:keyId/stats", authMiddleware, getUsage); // alias to getUsage for now

module.exports = router;