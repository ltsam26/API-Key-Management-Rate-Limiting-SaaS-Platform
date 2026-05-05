const pool = require("../config/db");
const { createProject, getProjectsByUserId } = require("../models/project.model");

const createNewProject = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.userId;

    if (!name) {
      return res.status(400).json({ message: "Project name is required" });
    }

    const project = await createProject(userId, name);

    res.status(201).json({
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getUserProjects = async (req, res) => {
  try {
    const userId = req.user.userId;

    const projects = await getProjectsByUserId(userId);

    res.status(200).json({
      message: "Projects fetched successfully",
      projects,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.userId;

    const result = await pool.query(
      `UPDATE projects 
       SET is_active = false 
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [projectId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.status(200).json({
      message: "Project deleted successfully (soft delete)",
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to delete project",
      error: error.message,
    });
  }
};

module.exports = {
  createNewProject,
  getUserProjects,
  deleteProject,
};