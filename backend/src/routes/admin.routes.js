const express = require("express");
const router = express.Router();
const adminMiddleware = require("../middlewares/admin.middleware");
const { 
  getSystemStats, 
  getUsers, 
  getProjects, 
  getApiKeys, 
  getUsageLogs,
  toggleApiKey
} = require("../controllers/admin.controller");

router.use(adminMiddleware); // All routes inside are secure!

router.get("/system-stats", getSystemStats);
router.get("/users", getUsers);
router.get("/projects", getProjects);
router.get("/api-keys", getApiKeys);
router.get("/usage-logs", getUsageLogs);
router.post("/api-keys/:id/toggle", toggleApiKey);

module.exports = router;