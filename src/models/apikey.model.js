const pool = require("../config/db");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

const createApiKey = async (projectId, keyHash, name, permissions, expiresAt, allowedIps) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const keyQuery = `
      INSERT INTO api_keys (project_id, key_hash, name, permissions, expires_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, permissions, expires_at, created_at, is_active
    `;
    const keyResult = await client.query(keyQuery, [
      projectId, keyHash, name || "Default Key", JSON.stringify(permissions || ["all"]), expiresAt || null
    ]);
    const newKey = keyResult.rows[0];

    // Insert security
    const secQuery = `
      INSERT INTO api_key_security (api_key_id, allowed_ips)
      VALUES ($1, $2)
    `;
    await client.query(secQuery, [newKey.id, allowedIps || []]);

    await client.query("COMMIT");
    return newKey;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

const getKeysForUser = async (userId) => {
  const query = `
    SELECT k.id, k.name, k.is_active, k.created_at, k.expires_at, k.permissions, p.name AS project_name,
           s.allowed_ips,
           (SELECT COUNT(*) FROM api_logs u WHERE u.api_key_id = k.id) AS total_requests,
           (SELECT MAX(created_at) FROM api_logs u WHERE u.api_key_id = k.id) AS last_used_at
    FROM api_keys k
    JOIN projects p ON k.project_id = p.id
    LEFT JOIN api_key_security s ON s.api_key_id = k.id
    WHERE p.user_id = $1
    ORDER BY k.created_at DESC
  `;
  const result = await pool.query(query, [userId]);
  return result.rows;
};

const getApiKeyWithProject = async (keyId) => {
  const query = `
    SELECT ak.*, p.user_id
    FROM api_keys ak
    JOIN projects p ON ak.project_id = p.id
    WHERE ak.id = $1
  `;
  const result = await pool.query(query, [keyId]);
  return result.rows[0];
};

const revokeApiKey = async (keyId) => {
  const query = `UPDATE api_keys SET is_active = FALSE WHERE id = $1 RETURNING id, is_active`;
  const result = await pool.query(query, [keyId]);
  return result.rows[0];
};

const rotateApiKey = async (keyId) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    await client.query("UPDATE api_keys SET is_active = false WHERE id = $1", [keyId]);
    
    const oldKeyQuery = await client.query("SELECT * FROM api_keys WHERE id = $1", [keyId]);
    const oldKey = oldKeyQuery.rows[0];
    
    const securityQuery = await client.query("SELECT * FROM api_key_security WHERE api_key_id = $1", [keyId]);
    const oldSecurity = securityQuery.rows[0] || { allowed_ips: [] };

    const newRawKey = crypto.randomBytes(32).toString("hex");
    const hashedKey = await bcrypt.hash(newRawKey, 10);

    const keyQuery = `
      INSERT INTO api_keys (project_id, key_hash, name, permissions, expires_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;
    const newKeyResult = await client.query(keyQuery, [
      oldKey.project_id, hashedKey, oldKey.name + " (Rotated)", oldKey.permissions, oldKey.expires_at
    ]);
    const newKeyId = newKeyResult.rows[0].id;

    const secQuery = `
      INSERT INTO api_key_security (api_key_id, allowed_ips)
      VALUES ($1, $2)
    `;
    await client.query(secQuery, [newKeyId, oldSecurity.allowed_ips]);

    await client.query("COMMIT");
    return { newKey: newRawKey, keyId: newKeyId };
  } catch(err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

const updateKeySecurity = async (keyId, allowedIps) => {
  const query = `
    INSERT INTO api_key_security (api_key_id, allowed_ips)
    VALUES ($1, $2)
    ON CONFLICT (api_key_id) DO UPDATE SET allowed_ips = EXCLUDED.allowed_ips
    RETURNING allowed_ips
  `;
  const res = await pool.query(query, [keyId, allowedIps]);
  return res.rows[0];
};

const updateKeySettings = async (keyId, name, permissions, expiresAt) => {
  const query = `
    UPDATE api_keys
    SET name = COALESCE($2, name),
        permissions = COALESCE($3, permissions),
        expires_at = $4
    WHERE id = $1
    RETURNING id, name, permissions, expires_at
  `;
  const res = await pool.query(query, [keyId, name, permissions ? JSON.stringify(permissions) : null, expiresAt]);
  return res.rows[0];
};

const getKeyLogs = async (keyId) => {
  const query = `
    SELECT id, endpoint, method, status_code, created_at
    FROM api_logs
    WHERE api_key_id = $1
    ORDER BY created_at DESC
    LIMIT 100
  `;
  const res = await pool.query(query, [keyId]);
  return res.rows;
};

const getKeyUsage = async (keyId) => {
  const query = `
    SELECT DATE(created_at) as date, COUNT(*) as requests,
           COUNT(*) FILTER (WHERE status_code >= 400) as errors
    FROM api_logs
    WHERE api_key_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `;
  const res = await pool.query(query, [keyId]);
  return res.rows;
};

const getAllActiveApiKeys = async () => {
    const query = `
      SELECT a.id, a.project_id, a.key_hash, p.user_id, p.plan
      FROM api_keys a
      JOIN projects p ON a.project_id = p.id
      WHERE a.is_active = TRUE
    `;
    const result = await pool.query(query);
    return result.rows;
};

const findKeyByHash = async (hashedKey) => {
  const query = `
    SELECT k.*, p.user_id, p.plan, s.allowed_ips
    FROM api_keys k
    JOIN projects p ON k.project_id = p.id
    LEFT JOIN api_key_security s ON s.api_key_id = k.id
    WHERE k.key_hash = $1 AND k.is_active = TRUE
  `;
  const res = await pool.query(query, [hashedKey]);
  return res.rows[0];
};

module.exports = {
  createApiKey,
  getKeysForUser,
  getApiKeyWithProject,
  revokeApiKey,
  rotateApiKey,
  updateKeySecurity,
  updateKeySettings,
  getKeyLogs,
  getKeyUsage,
  getAllActiveApiKeys,
  findKeyByHash
};