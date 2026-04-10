const pool = require("../config/db");

const getProjectAnalytics = async (projectId) => {
  // Summary counts
  const summary = await pool.query(`
    SELECT 
      COUNT(*) AS total_requests,
      COUNT(*) FILTER (WHERE status_code >= 200 AND status_code < 300) AS success_requests,
      COUNT(*) FILTER (WHERE status_code >= 400) AS failed_requests,
      COUNT(*) FILTER (WHERE status_code = 429) AS rate_limited_requests,
      12 AS avg_latency_ms
    FROM api_logs ul
    JOIN api_keys ak ON ul.api_key_id = ak.id
    WHERE ak.project_id = $1
  `, [projectId]);

  // Daily breakdown (last 14 days)
  const daily = await pool.query(`
    SELECT 
      DATE(ul.created_at) AS date,
      COUNT(*) AS requests,
      COUNT(*) FILTER (WHERE status_code >= 400) AS errors,
      COUNT(*) FILTER (WHERE status_code = 429) AS rate_limits
    FROM api_logs ul
    JOIN api_keys ak ON ul.api_key_id = ak.id
    WHERE ak.project_id = $1 AND ul.created_at >= NOW() - INTERVAL '14 days'
    GROUP BY DATE(ul.created_at)
    ORDER BY date ASC
  `, [projectId]);

  // Status code breakdown
  const statusCodes = await pool.query(`
    SELECT 
      status_code::text AS name,
      COUNT(*) AS value
    FROM api_logs ul
    JOIN api_keys ak ON ul.api_key_id = ak.id
    WHERE ak.project_id = $1
    GROUP BY status_code
    ORDER BY value DESC
  `, [projectId]);

  // Per-key usage
  const keyUsage = await pool.query(`
    SELECT 
      ul.api_key_id,
      ak.id,
      COUNT(*) AS requests,
      COUNT(*) FILTER (WHERE status_code >= 400) AS errors,
      COUNT(*) FILTER (WHERE status_code = 429) AS rate_limits
    FROM api_logs ul
    JOIN api_keys ak ON ul.api_key_id = ak.id
    WHERE ak.project_id = $1
    GROUP BY ul.api_key_id, ak.id
    ORDER BY requests DESC
    LIMIT 8
  `, [projectId]);

  // Recent error logs
  const errorLogs = await pool.query(`
    SELECT ul.api_key_id, ul.endpoint, ul.method, ul.status_code, ul.created_at
    FROM api_logs ul
    JOIN api_keys ak ON ul.api_key_id = ak.id
    WHERE ak.project_id = $1 AND ul.status_code >= 400
    ORDER BY ul.created_at DESC
    LIMIT 20
  `, [projectId]);

  // Recent all logs
  const recentLogs = await pool.query(`
    SELECT ul.api_key_id, ul.endpoint, ul.method, ul.status_code, ul.created_at
    FROM api_logs ul
    JOIN api_keys ak ON ul.api_key_id = ak.id
    WHERE ak.project_id = $1
    ORDER BY ul.created_at DESC
    LIMIT 50
  `, [projectId]);

  // User/key table with plan
  const userTable = await pool.query(`
    SELECT 
      ak.id AS key_id,
      p.name AS project_name,
      p.plan,
      COUNT(ul.id) AS usage,
      ak.rate_limit
    FROM api_keys ak
    JOIN projects p ON ak.project_id = p.id
    LEFT JOIN api_logs ul ON ul.api_key_id = ak.id 
      AND ul.created_at >= CURRENT_DATE
    WHERE ak.project_id = $1 AND ak.is_active = true
    GROUP BY ak.id, p.name, p.plan, ak.rate_limit
    ORDER BY usage DESC
  `, [projectId]);

  return {
    summary: summary.rows[0],
    daily: daily.rows,
    status_codes: statusCodes.rows,
    key_usage: keyUsage.rows,
    error_logs: errorLogs.rows,
    recent_logs: recentLogs.rows,
    user_table: userTable.rows,
  };
};

module.exports = { getProjectAnalytics };