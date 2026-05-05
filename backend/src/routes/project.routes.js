const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const {
  createNewProject,
  getUserProjects,
   deleteProject   // ✅ ADD THIS
} = require("../controllers/project.controller");

router.post("/", authMiddleware, createNewProject);
router.get("/", authMiddleware, getUserProjects);
router.delete("/:projectId", authMiddleware, deleteProject);

module.exports = router;