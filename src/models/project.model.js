const pool = require("../config/db");

const createProject = async (userId, name) => {
  const query = `
    INSERT INTO projects (user_id, name)
    VALUES ($1, $2)
    RETURNING id, name, created_at
  `;
  const values = [userId, name];
  const result = await pool.query(query, values);
  return result.rows[0];
};

const getProjectsByUserId = async (userId) => {
  const query = `
    SELECT id, name, created_at
    FROM projects
    WHERE user_id = $1
    ORDER BY created_at DESC
  `;
  const result = await pool.query(query, [userId]);
  return result.rows;
};

module.exports = {
  createProject,
  getProjectsByUserId,
};