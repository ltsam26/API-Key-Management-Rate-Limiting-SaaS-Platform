const pool = require("../config/db");

const createUser = async (email, passwordHash = null, googleId = null, githubId = null, avatarUrl = null) => {
  const query = `
    INSERT INTO users (email, password_hash, google_id, github_id, avatar_url)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, email, role, google_id, github_id, avatar_url, created_at
  `;
  const values = [email, passwordHash, googleId, githubId, avatarUrl];
  const result = await pool.query(query, values);
  return result.rows[0];
};

const findUserByEmail = async (email) => {
  const query = `SELECT * FROM users WHERE email = $1`;
  const result = await pool.query(query, [email]);
  return result.rows[0];
};

const findUserByProviderId = async (provider, providerId) => {
  const column = provider === 'google' ? 'google_id' : 'github_id';
  const query = `SELECT * FROM users WHERE ${column} = $1`;
  const result = await pool.query(query, [providerId]);
  return result.rows[0];
};

const linkProvider = async (userId, provider, providerId, avatarUrl) => {
  const column = provider === 'google' ? 'google_id' : 'github_id';
  const query = `
    UPDATE users 
    SET ${column} = $1, avatar_url = COALESCE(avatar_url, $2)
    WHERE id = $3
    RETURNING *
  `;
  const result = await pool.query(query, [providerId, avatarUrl, userId]);
  return result.rows[0];
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserByProviderId,
  linkProvider
};