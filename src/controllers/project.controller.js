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

module.exports = {
  createNewProject,
  getUserProjects,
};