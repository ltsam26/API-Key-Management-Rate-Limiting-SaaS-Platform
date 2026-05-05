const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const { fetchAnalytics, getUserOverview } = require("../controllers/analytics.controller");

router.get("/user/overview", authMiddleware, getUserOverview);
router.get("/:projectId", authMiddleware, fetchAnalytics);

module.exports = router;