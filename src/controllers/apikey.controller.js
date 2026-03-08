

const crypto = require("crypto");
const bcrypt = require("bcrypt");

const { 
  createApiKey, 
  getApiKeysByProjectId, 
  revokeApiKey,
  getApiKeyWithProject,
  rotateApiKey   // ✅
} = require("../models/apikey.model");

const generateApiKey = async (req, res) => {
  try {
    const { projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({ message: "Project ID is required" });
    }

    // 🔹 STEP 1: Check max_api_keys limit
    const limitResult = await pool.query(
      `SELECT max_api_keys FROM projects WHERE id = $1`,
      [projectId]
    );

    const maxKeys = limitResult.rows[0].max_api_keys;

    const keyCountResult = await pool.query(
      `SELECT COUNT(*) FROM api_keys 
       WHERE project_id = $1 AND is_active = true`,
      [projectId]
    );

    const activeKeyCount = parseInt(keyCountResult.rows[0].count);

    if (activeKeyCount >= maxKeys) {
      return res.status(403).json({
        message: "API key limit reached for this project",
      });
    }

    // 🔹 STEP 2: Generate secure random API key
    const rawApiKey = crypto.randomBytes(32).toString("hex");

    const saltRounds = 10;
    const keyHash = await bcrypt.hash(rawApiKey, saltRounds);

    const apiKey = await createApiKey(projectId, keyHash);

    res.status(201).json({
      message: "API key generated successfully",
      apiKey: rawApiKey,
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





const rotateKey = async (req, res) => {
  try {
    const { keyId } = req.params;
    const userId = req.user.userId;

    const keyData = await getApiKeyWithProject(keyId);

    if (!keyData) {
      return res.status(404).json({ message: "API key not found" });
    }

    if (keyData.user_id !== userId) {
      return res.status(403).json({
        message: "Unauthorized: You do not own this API key",
      });
    }

    const rotated = await rotateApiKey(keyId);

    res.status(200).json({
      message: "API key rotated successfully",
      newApiKey: rotated.newKey,
      keyId: rotated.keyId,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to rotate API key",
      error: error.message,
    });
  }
};


module.exports = {
  generateApiKey,
  getProjectApiKeys,
  revokeKey,
  rotateKey,
};
   
