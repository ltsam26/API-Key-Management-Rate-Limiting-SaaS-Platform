const { getProjectAnalytics } = require("../models/analytics.model");

const fetchAnalytics = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      return res.status(400).json({ message: "Project ID required" });
    }

    const analytics = await getProjectAnalytics(projectId);

    res.status(200).json({
      message: "Analytics fetched successfully",
      analytics,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch analytics",
      error: error.message,
    });
  }
};

module.exports = {
  fetchAnalytics,
};