

const crypto = require("crypto");
const bcrypt = require("bcrypt");

const { 
  createApiKey, 
  getApiKeysByProjectId, 
  revokeApiKey,
  getApiKeyWithProject
} = require("../models/apikey.model");

const generateApiKey = async (req, res) => {
  try {
    const { projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({ message: "Project ID is required" });
    }

    // Generate secure random API key
    const rawApiKey = crypto.randomBytes(32).toString("hex");

    // Hash the API key before storing (security best practice)
    const saltRounds = 10;
    const keyHash = await bcrypt.hash(rawApiKey, saltRounds);

    const apiKey = await createApiKey(projectId, keyHash);

    res.status(201).json({
      message: "API key generated successfully",
      apiKey: rawApiKey, // shown ONLY once
      keyInfo: apiKey,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getProjectApiKeys = async (req, res) => {
  try {
    const { projectId } = req.params;

    const keys = await getApiKeysByProjectId(projectId);

    res.status(200).json({
      message: "API keys fetched successfully",
      keys,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


const revokeKey = async (req, res) => {
  try {
    const { keyId } = req.params;
    const userId = req.user.userId; // From JWT middleware

    if (!keyId) {
      return res.status(400).json({ message: "API Key ID is required" });
    }

    // Fetch key with project ownership info
    const keyData = await getApiKeyWithProject(keyId);

    if (!keyData) {
      return res.status(404).json({ message: "API key not found" });
    }

    // SECURITY CHECK: Ensure user owns the project
    if (keyData.user_id !== userId) {
      return res.status(403).json({
        message: "Unauthorized: You do not own this API key",
      });
    }

    const revoked = await revokeApiKey(keyId);

    res.status(200).json({
      message: "API key revoked successfully",
      key: revoked,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to revoke API key",
      error: error.message,
    });
  }
};
module.exports = {
  generateApiKey,
  getProjectApiKeys,
   revokeKey,
};