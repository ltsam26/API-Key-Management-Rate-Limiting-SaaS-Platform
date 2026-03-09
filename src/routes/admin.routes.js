const express = require("express");
const router = express.Router();

const { getSystemStats } = require("../controllers/admin.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.get("/system-stats", authMiddleware, getSystemStats);

module.exports = router;