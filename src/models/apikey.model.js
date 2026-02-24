const pool = require("../config/db");

const createApiKey = async (projectId, keyHash) => {
  const query = `
    INSERT INTO api_keys (project_id, key_hash)
    VALUES ($1, $2)
    RETURNING id, created_at
  `;
  const values = [projectId, keyHash];
  const result = await pool.query(query, values);
  return result.rows[0];
};

const getApiKeysByProjectId = async (projectId) => {
  const query = `
    SELECT id, is_active, created_at
    FROM api_keys
    WHERE project_id = $1
    ORDER BY created_at DESC
  `;
  const result = await pool.query(query, [projectId]);
  return result.rows;
};

module.exports = {
  createApiKey,
  getApiKeysByProjectId,
};

const getAllActiveApiKeys = async () => {
  const query = `
    SELECT id, project_id, key_hash
    FROM api_keys
    WHERE is_active = TRUE
  `;
  const result = await pool.query(query);
  return result.rows;
};


const revokeApiKey = async (keyId) => {
  const query = `
    UPDATE api_keys
    SET is_active = FALSE
    WHERE id = $1
    RETURNING id, is_active
  `;
  const result = await pool.query(query, [keyId]);
  return result.rows[0];
};

const getApiKeyWithProject = async (keyId) => {
  const query = `
    SELECT ak.id, ak.project_id, p.user_id
    FROM api_keys ak
    JOIN projects p ON ak.project_id = p.id
    WHERE ak.id = $1
  `;
  const result = await pool.query(query, [keyId]);
  return result.rows[0];
};

module.exports = {
  createApiKey,
  getApiKeysByProjectId,
  getAllActiveApiKeys,
  revokeApiKey, // ADD THIS
  getApiKeyWithProject,
};