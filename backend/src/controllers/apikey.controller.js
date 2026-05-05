const crypto = require("crypto");
const bcrypt = require("bcrypt");
const pool = require("../config/db");

const { 
  createApiKey, 
  getKeysForUser, 
  revokeApiKey,
  getApiKeyWithProject,
  rotateApiKey,
  updateKeySecurity,
  updateKeySettings,
  getKeyLogs,
  getKeyUsage
} = require("../models/apikey.model");

const generateApiKey = async (req, res) => {
  try {
    const { projectId, name, permissions, expiresAt, allowedIps } = req.body;
    if (!projectId) return res.status(400).json({ message: "Project ID is required" });

    // Check max_api_keys limit
    const limitResult = await pool.query(`SELECT max_api_keys FROM projects WHERE id = $1`, [projectId]);
    const maxKeys = limitResult.rows[0]?.max_api_keys || 5;

    const keyCountResult = await pool.query(`SELECT COUNT(*) FROM api_keys WHERE project_id = $1 AND is_active = true`, [projectId]);
    const activeKeyCount = parseInt(keyCountResult.rows[0].count);

    if (activeKeyCount >= maxKeys) {
      return res.status(403).json({ message: "API key limit reached for this project" });
    }

    const rawApiKey = crypto.randomBytes(32).toString("hex");
    const keyHash = await bcrypt.hash(rawApiKey, 10);

    const apiKeyInfo = await createApiKey(projectId, keyHash, name, permissions, expiresAt || null, allowedIps || []);

    res.status(201).json({
      message: "API key generated successfully",
      apiKey: rawApiKey,
      keyInfo: apiKeyInfo,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const listUserApiKeys = async (req, res) => {
  try {
    const userId = req.user.userId;
    const keys = await getKeysForUser(userId);
    res.status(200).json({ keys });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const revokeKey = async (req, res) => {
  try {
    const { keyId } = req.params;
    const userId = req.user.userId;

    const keyData = await getApiKeyWithProject(keyId);
    if (!keyData) return res.status(404).json({ message: "API key not found" });
    if (keyData.user_id !== userId) return res.status(403).json({ message: "Unauthorized" });

    const revoked = await revokeApiKey(keyId);
    res.status(200).json({ message: "API key revoked successfully", key: revoked });
  } catch (error) {
    res.status(500).json({ message: "Failed to revoke API key", error: error.message });
  }
};

const rotateKey = async (req, res) => {
  try {
    const { keyId } = req.params;
    const userId = req.user.userId;

    const keyData = await getApiKeyWithProject(keyId);
    if (!keyData) return res.status(404).json({ message: "API key not found" });
    if (keyData.user_id !== userId) return res.status(403).json({ message: "Unauthorized" });

    const rotated = await rotateApiKey(keyId);
    res.status(200).json({
      message: "API key rotated successfully",
      newApiKey: rotated.newKey,
      keyId: rotated.keyId,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to rotate API key", error: error.message });
  }
};

const setKeySecurity = async (req, res) => {
  try {
    const { keyId } = req.params;
    const { allowedIps } = req.body;
    const userId = req.user.userId;

    const keyData = await getApiKeyWithProject(keyId);
    if (keyData.user_id !== userId) return res.status(403).json({ message: "Unauthorized" });

    const updated = await updateKeySecurity(keyId, allowedIps);
    res.status(200).json({ message: "Security updated", security: updated });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const setKeySettings = async (req, res) => {
  try {
    const { keyId } = req.params;
    const { name, permissions, expiresAt } = req.body;
    const userId = req.user.userId;

    const keyData = await getApiKeyWithProject(keyId);
    if (keyData.user_id !== userId) return res.status(403).json({ message: "Unauthorized" });

    const updated = await updateKeySettings(keyId, name, permissions, expiresAt);
    res.status(200).json({ message: "Settings updated", key: updated });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getLogs = async (req, res) => {
  try {
    const { keyId } = req.params;
    const userId = req.user.userId;
    const keyData = await getApiKeyWithProject(keyId);
    if (keyData.user_id !== userId) return res.status(403).json({ message: "Unauthorized" });

    const logs = await getKeyLogs(keyId);
    res.status(200).json({ logs });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getUsage = async (req, res) => {
  try {
    const { keyId } = req.params;
    const userId = req.user.userId;
    const keyData = await getApiKeyWithProject(keyId);
    if (keyData.user_id !== userId) return res.status(403).json({ message: "Unauthorized" });

    const usage = await getKeyUsage(keyId);
    res.status(200).json({ usage });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  generateApiKey,
  listUserApiKeys,
  revokeKey,
  rotateKey,
  setKeySecurity,
  setKeySettings,
  getLogs,
  getUsage
};
