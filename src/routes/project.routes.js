const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const {
  createNewProject,
  getUserProjects,
} = require("../controllers/project.controller");

router.post("/", authMiddleware, createNewProject);
router.get("/", authMiddleware, getUserProjects);

module.exports = router;