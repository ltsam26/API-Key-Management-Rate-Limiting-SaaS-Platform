const pool = require("../config/db");

const getSystemStats = async (req, res) => {
  try {
    const users = await pool.query(`SELECT COUNT(*) FROM users`);
    const projects = await pool.query(`SELECT COUNT(*) FROM projects`);
    const apiKeys = await pool.query(`SELECT COUNT(*) FROM api_keys`);
    const apiCalls = await pool.query(`SELECT COUNT(*) FROM usage_logs`);

    res.status(200).json({
      system: "API Platform",
      stats: {
        users: parseInt(users.rows[0].count),
        projects: parseInt(projects.rows[0].count),
        apiKeys: parseInt(apiKeys.rows[0].count),
        apiCalls: parseInt(apiCalls.rows[0].count)
      }
    });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

const getUsers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.email, u.role, u.created_at, 
             COALESCE(s.plan_type, 'FREE') as plan_type
      FROM users u 
      LEFT JOIN subscriptions s ON u.id = s.user_id 
      ORDER BY u.created_at DESC
    `);
    res.status(200).json({ users: result.rows });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

const getProjects = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.name, p.plan, p.created_at, u.email as owner_email
      FROM projects p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
    `);
    res.status(200).json({ projects: result.rows });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

const getApiKeys = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.id, a.is_active, a.created_at, p.name as project_name, u.email as owner_email
      FROM api_keys a
      JOIN projects p ON a.project_id = p.id
      JOIN users u ON p.user_id = u.id
      ORDER BY a.created_at DESC
    `);
    res.status(200).json({ keys: result.rows });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

const getUsageLogs = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT l.id, l.created_at as timestamp, l.status_code, 'N/A' as ip_address, a.id as key_id, u.email
      FROM usage_logs l
      JOIN api_keys a ON l.api_key_id = a.id
      JOIN projects p ON a.project_id = p.id
      JOIN users u ON p.user_id = u.id
      ORDER BY l.created_at DESC LIMIT 100
    `);
    res.status(200).json({ logs: result.rows });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

const toggleApiKey = async (req, res) => {
  try {
    const { id } = req.params;
    const { activate } = req.body;
    await pool.query(`UPDATE api_keys SET is_active = $1 WHERE id = $2`, [activate, id]);
    res.status(200).json({ message: "Key updated" });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

module.exports = {
  getSystemStats, getUsers, getProjects, getApiKeys, getUsageLogs, toggleApiKey
};