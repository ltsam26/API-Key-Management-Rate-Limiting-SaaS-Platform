const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const { fetchAnalytics } = require("../controllers/analytics.controller");

router.get("/:projectId", authMiddleware, fetchAnalytics);

module.exports = router;