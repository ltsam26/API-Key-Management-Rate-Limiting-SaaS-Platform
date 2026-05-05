const { getProjectAnalytics } = require("../models/analytics.model");
const pool = require("../config/db");

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

const getUserOverview = async (req, res) => {
  try {
    const userId = req.user.userId;

    // 1. Basic Stats
    const totalProjects = await pool.query('SELECT COUNT(*) FROM projects WHERE user_id = $1', [userId]);
    const activeKeys = await pool.query(`
      SELECT COUNT(*) FROM api_keys a 
      JOIN projects p ON a.project_id = p.id 
      WHERE p.user_id = $1 AND a.is_active = true
    `, [userId]);

    // 2. Global Usage Stats (All time)
    const usageStats = await pool.query(`
      SELECT 
        COUNT(*) AS total_requests,
        COUNT(*) FILTER (WHERE l.status_code >= 400) AS total_errors,
        COUNT(*) FILTER (WHERE l.status_code = 429) AS rate_limits_hit
      FROM api_logs l
      JOIN api_keys a ON l.api_key_id = a.id
      JOIN projects p ON a.project_id = p.id
      WHERE p.user_id = $1
    `, [userId]);

    const reqs = parseInt(usageStats.rows[0].total_requests) || 0;
    const errs = parseInt(usageStats.rows[0].total_errors) || 0;
    const limits = parseInt(usageStats.rows[0].rate_limits_hit) || 0;
    const costEstimate = ((reqs / 1000) * 0.50).toFixed(2); // $0.50 per 1k requests

    // 3. Daily Trend (last 14 days)
    const dailyTrend = await pool.query(`
      SELECT DATE(l.created_at) AS date, COUNT(*) AS requests
      FROM api_logs l
      JOIN api_keys a ON l.api_key_id = a.id
      JOIN projects p ON a.project_id = p.id
      WHERE p.user_id = $1 AND l.created_at >= NOW() - INTERVAL '14 days'
      GROUP BY DATE(l.created_at)
      ORDER BY date ASC
    `, [userId]);

    // 4. Token Consumption by Project
    const projectConsumption = await pool.query(`
      SELECT p.name AS project, COUNT(l.id) AS tokens
      FROM projects p
      LEFT JOIN api_keys a ON a.project_id = p.id
      LEFT JOIN api_logs l ON l.api_key_id = a.id
      WHERE p.user_id = $1
      GROUP BY p.id, p.name
      ORDER BY tokens DESC
      LIMIT 5
    `, [userId]);

    // 5. Recent Activity
    const recentActivity = await pool.query(`
      SELECT l.endpoint, l.method, l.status_code, l.created_at, p.name as project_name
      FROM api_logs l
      JOIN api_keys a ON l.api_key_id = a.id
      JOIN projects p ON a.project_id = p.id
      WHERE p.user_id = $1
      ORDER BY l.created_at DESC
      LIMIT 6
    `, [userId]);
    
    // 6. Plan info
    const sub = await pool.query('SELECT plan_type FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [userId]);
    const plan = sub.rows[0]?.plan_type || 'FREE';

    res.status(200).json({
      totalProjects: parseInt(totalProjects.rows[0].count) || 0,
      activeKeys: parseInt(activeKeys.rows[0].count) || 0,
      plan,
      metrics: {
        totalRequests: reqs,
        totalErrors: errs,
        rateLimitsHit: limits,
        costEstimate
      },
      dailyTrend: dailyTrend.rows,
      projectConsumption: projectConsumption.rows,
      recentActivity: recentActivity.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  fetchAnalytics,
  getUserOverview,
};