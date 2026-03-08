const pool = require("../config/db");

const getProjectAnalytics = async (projectId) => {
  // 1️⃣ Overall counts
  const summaryQuery = `
    SELECT 
      COUNT(*) AS total_requests,
      COUNT(*) FILTER (WHERE status_code = 200) AS success_requests,
      COUNT(*) FILTER (WHERE status_code >= 400) AS failed_requests
    FROM usage_logs ul
    JOIN api_keys ak ON ul.api_key_id = ak.id
    WHERE ak.project_id = $1
  `;

  const summaryResult = await pool.query(summaryQuery, [projectId]);

  // 2️⃣ Group by endpoint
  const endpointQuery = `
    SELECT ul.endpoint, COUNT(*) AS count
    FROM usage_logs ul
    JOIN api_keys ak ON ul.api_key_id = ak.id
    WHERE ak.project_id = $1
    GROUP BY ul.endpoint
    ORDER BY count DESC
  `;

  const endpointResult = await pool.query(endpointQuery, [projectId]);

  // 3️⃣ Group by method
  const methodQuery = `
    SELECT ul.method, COUNT(*) AS count
    FROM usage_logs ul
    JOIN api_keys ak ON ul.api_key_id = ak.id
    WHERE ak.project_id = $1
    GROUP BY ul.method
    ORDER BY count DESC
  `;

  const methodResult = await pool.query(methodQuery, [projectId]);

  // 4️⃣ Group by day
const dailyQuery = `
  SELECT DATE(ul.created_at) AS date, COUNT(*) AS count
  FROM usage_logs ul
  JOIN api_keys ak ON ul.api_key_id = ak.id
  WHERE ak.project_id = $1
  GROUP BY DATE(ul.created_at)
  ORDER BY date DESC
`;

const dailyResult = await pool.query(dailyQuery, [projectId]);


// 5️⃣ Group by month
const monthlyQuery = `
  SELECT TO_CHAR(ul.created_at, 'YYYY-MM') AS month,
         COUNT(*) AS count
  FROM usage_logs ul
  JOIN api_keys ak ON ul.api_key_id = ak.id
  WHERE ak.project_id = $1
  GROUP BY TO_CHAR(ul.created_at, 'YYYY-MM')
  ORDER BY month DESC
`;

const monthlyResult = await pool.query(monthlyQuery, [projectId]);

  return {
    ...summaryResult.rows[0],
    by_endpoint: endpointResult.rows,
    by_method: methodResult.rows,
    by_day: dailyResult.rows,
    by_month: monthlyResult.rows,
  };
};

module.exports = {
  getProjectAnalytics,
};