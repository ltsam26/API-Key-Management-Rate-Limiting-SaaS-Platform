const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const {
  generateApiKey,
  getProjectApiKeys,
  revokeKey,
  rotateKey,
} = require("../controllers/apikey.controller");

router.post("/generate", authMiddleware, generateApiKey);
router.get("/:projectId", authMiddleware, getProjectApiKeys);
router.patch("/revoke/:keyId", authMiddleware, revokeKey);
router.post("/rotate/:keyId", authMiddleware, rotateKey);

module.exports = router;