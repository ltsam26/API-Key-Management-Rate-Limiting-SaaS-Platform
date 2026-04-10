import { useEffect, useState } from 'react';
import { getProjects } from '../../services/project.service';
import { getAnalytics } from '../../services/analytics.service';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  LineChart, Line,
} from 'recharts';

const COLORS = ['#7c6fcd', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];
const PLAN_DAILY_QUOTA = { FREE: 100, PRO: 2000, ENTERPRISE: 10000 };

const RATE_COST = { FREE: 0, PRO: 29, ENTERPRISE: 199 }; // $ per month

export default function Analytics() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    getProjects().then((res) => {
      const list = res.data.projects || res.data || [];
      setProjects(list);
      if (list.length > 0) setSelectedProject(list[0].id);
    });
  }, []);

  useEffect(() => {
    if (selectedProject) fetchAnalytics();
  }, [selectedProject]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    setData(null);
    try {
      const res = await getAnalytics(selectedProject);
      const payload = res.data?.analytics || res.data;
      setData(payload);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  };

  const project = projects.find((p) => p.id === selectedProject);
  const summary = data?.summary || {};
  const daily = data?.daily || [];
  const statusCodes = data?.status_codes || [];
  const keyUsage = data?.key_usage || [];
  const errorLogs = data?.error_logs || [];
  const recentLogs = data?.recent_logs || [];
  const userTable = data?.user_table || [];

  const totalReqs = parseInt(summary.total_requests) || 0;
  const totalErrors = parseInt(summary.failed_requests) || 0;
  const rateLimited = parseInt(summary.rate_limited_requests) || 0;
  const successRate = totalReqs > 0 ? (((totalReqs - totalErrors) / totalReqs) * 100).toFixed(1) : '0';

  const plan = (project?.plan || 'FREE').toUpperCase();
  const dailyQuota = PLAN_DAILY_QUOTA[plan] || 100;
  const todayUsage = parseInt(userTable.reduce((s, r) => s + parseInt(r.usage || 0), 0));
  const quotaLeft = Math.max(0, dailyQuota - todayUsage);
  const estimatedCost = ((totalReqs / 1000) * 0.5).toFixed(2); // $0.50 per 1k req

  const costData = daily.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month:'short', day:'numeric' }),
    cost: ((parseInt(d.requests) / 1000) * 0.5).toFixed(2),
    requests: parseInt(d.requests),
    errors: parseInt(d.errors),
    rate_limits: parseInt(d.rate_limits),
  }));

  const logSource = activeTab === 'errors'
    ? errorLogs
    : activeTab === 'ratelimit'
      ? recentLogs.filter(l => l.status_code == 429)
      : recentLogs;

  return (
    <div>
      {/* ── Header ── */}
      <div style={s.header}>
        <div>
          <h1 style={s.heading}>Analytics</h1>
          <p style={s.sub}>Monitor usage, errors, rate limits and costs</p>
        </div>
        <select
          style={s.select}
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {error && <div style={s.errorBar}>{error}</div>}

      {loading && (
        <div style={s.loadingWrap}>
          <div style={s.spinner} />
          <p style={s.muted}>Loading analytics...</p>
        </div>
      )}

      {!loading && data && (
        <>
          {/* ── TOP CARDS ── */}
          <div style={s.cardGrid}>
            {[
              { label: 'Total Requests', value: totalReqs.toLocaleString(), icon: '⚡', color: '#7c6fcd', bg: '#1a1630' },
              { label: 'Errors (4xx/5xx)', value: totalErrors.toLocaleString(), icon: '❌', color: '#ef4444', bg: '#1e1010' },
              { label: 'Rate Limited', value: rateLimited.toLocaleString(), icon: '🚫', color: '#f59e0b', bg: '#1e1800' },
              { label: 'Success Rate', value: successRate + '%', icon: '✅', color: '#10b981', bg: '#0f1e18' },
              { label: 'Avg Latency', value: '~12ms', icon: '⏱', color: '#3b82f6', bg: '#0f1420' },
              { label: 'Cost Estimate', value: '$' + estimatedCost, icon: '💰', color: '#ec4899', bg: '#1e1018' },
            ].map((c) => (
              <div key={c.label} style={{ ...s.card, background: c.bg, borderColor: c.color + '22' }}>
                <div style={{ fontSize: '22px', marginBottom: '8px' }}>{c.icon}</div>
                <div style={{ ...s.cardValue, color: c.color }}>{c.value}</div>
                <div style={s.cardLabel}>{c.label}</div>
              </div>
            ))}
          </div>

          {/* ── GRAPH SECTION ── */}
          <div style={s.twoCol}>
            {/* Requests Chart */}
            <div style={s.chartBox}>
              <div style={s.chartTitle}>📈 Requests Over Time</div>
              {costData.length === 0 ? <div style={s.noData}>No data yet</div> : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={costData}>
                    <defs>
                      <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7c6fcd" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#7c6fcd" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#1e1e2e" strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fill: '#4b5563', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#4b5563', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={s.tooltip} />
                    <Area type="monotone" dataKey="requests" stroke="#7c6fcd" strokeWidth={2} fill="url(#reqGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Error & Rate Limit Chart */}
            <div style={s.chartBox}>
              <div style={s.chartTitle}>🔥 Errors & Rate Limits</div>
              {costData.length === 0 ? <div style={s.noData}>No data yet</div> : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={costData}>
                    <CartesianGrid stroke="#1e1e2e" strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fill: '#4b5563', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#4b5563', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={s.tooltip} />
                    <Bar dataKey="errors" fill="#ef4444" radius={[4,4,0,0]} name="Errors" />
                    <Bar dataKey="rate_limits" fill="#f59e0b" radius={[4,4,0,0]} name="Rate Limits" />
                    <Legend wrapperStyle={{ color: '#9ca3af', fontSize: '12px' }} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ── USER / KEY TABLE ── */}
          <div style={s.chartBox}>
            <div style={s.chartTitle}>👤 API Key Usage Table</div>
            {userTable.length === 0 ? (
              <div style={s.noData}>No active keys with data.</div>
            ) : (
              <div style={s.tableWrap}>
                <div style={{ ...s.tableRow, ...s.tableHead }}>
                  <span>Key ID</span>
                  <span>Project</span>
                  <span>Plan</span>
                  <span>Usage Today</span>
                  <span>Daily Quota</span>
                  <span>Quota Left</span>
                </div>
                {userTable.map((row, i) => {
                  const rowPlan = (row.plan || 'FREE').toUpperCase();
                  const rowQuota = PLAN_DAILY_QUOTA[rowPlan] || 100;
                  const rowUsage = parseInt(row.usage) || 0;
                  const rowLeft = Math.max(0, rowQuota - rowUsage);
                  const pct = Math.min(100, (rowUsage / rowQuota) * 100);
                  return (
                    <div key={i} style={s.tableRow}>
                      <span style={s.mono}>{row.key_id?.slice(0, 12)}…</span>
                      <span style={s.cell}>{row.project_name}</span>
                      <span>
                        <span style={{ ...s.planBadge, ...(badgeColor[rowPlan] || {}) }}>{rowPlan}</span>
                      </span>
                      <span style={s.cell}>{rowUsage.toLocaleString()}</span>
                      <span style={s.cell}>{rowQuota.toLocaleString()}</span>
                      <span>
                        <div style={s.quotaBar}>
                          <div style={{ ...s.quotaFill, width: pct + '%', background: pct > 80 ? '#ef4444' : '#10b981' }} />
                        </div>
                        <span style={{ ...s.cell, fontSize: '11px', color: rowLeft === 0 ? '#ef4444' : '#10b981' }}>
                          {rowLeft.toLocaleString()} left
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── LOGS & ERRORS ── */}
          <div style={s.chartBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={s.chartTitle}>📋 Request Logs</div>
              <div style={s.tabs}>
                {[['all','All'], ['errors','Errors'], ['ratelimit','Rate Limited']].map(([k,l]) => (
                  <button key={k} style={{ ...s.tab, ...(activeTab===k ? s.tabActive : {}) }} onClick={() => setActiveTab(k)}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            {logSource.length === 0 ? (
              <div style={s.noData}>No {activeTab !== 'all' ? activeTab + ' ' : ''}logs found.</div>
            ) : (
              <div style={s.tableWrap}>
                <div style={{ ...s.tableRow, ...s.tableHead, gridTemplateColumns: '1.5fr 2.5fr 0.7fr 0.8fr 1.2fr' }}>
                  <span>Key ID</span><span>Endpoint</span><span>Method</span><span>Status</span><span>Time</span>
                </div>
                {logSource.slice(0, 25).map((log, i) => (
                  <div key={i} style={{ ...s.tableRow, gridTemplateColumns: '1.5fr 2.5fr 0.7fr 0.8fr 1.2fr' }}>
                    <span style={s.mono}>{log.api_key_id?.slice(0, 12)}…</span>
                    <span style={{ ...s.mono, color: '#9ca3af' }}>{log.endpoint || '/api/public/data'}</span>
                    <span style={{ color: '#a89de0', fontSize: '12px', fontWeight: 600 }}>{log.method}</span>
                    <span style={log.status_code >= 400 ? s.errBadge : s.okBadge}>{log.status_code}</span>
                    <span style={{ color: '#4b5563', fontSize: '11px' }}>{new Date(log.created_at).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── COST SECTION ── */}
          <div style={s.twoCol}>
            {/* Cost Chart */}
            <div style={s.chartBox}>
              <div style={s.chartTitle}>💸 Estimated Cost Over Time</div>
              {costData.length === 0 ? <div style={s.noData}>No data yet</div> : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={costData}>
                    <CartesianGrid stroke="#1e1e2e" strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fill: '#4b5563', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#4b5563', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => '$' + v} />
                    <Tooltip contentStyle={s.tooltip} formatter={(v) => ['$' + v, 'Cost']} />
                    <Line type="monotone" dataKey="cost" stroke="#ec4899" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Status Codes / Top Spenders */}
            <div style={s.chartBox}>
              <div style={s.chartTitle}>🏆 Top Key Spenders</div>
              {keyUsage.length === 0 ? <div style={s.noData}>No data yet</div> : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={keyUsage.map(k => ({ key: k.key_id?.slice(0,8)+'...', requests: parseInt(k.requests) }))} layout="vertical">
                    <CartesianGrid stroke="#1e1e2e" strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#4b5563', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="key" type="category" tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} width={75} />
                    <Tooltip contentStyle={s.tooltip} cursor={{ fill: '#1e1e2e' }} />
                    <Bar dataKey="requests" fill="#7c6fcd" radius={[0,4,4,0]} name="Requests" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}

      {!loading && !data && !error && (
        <div style={s.empty}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📊</div>
          <p style={{ color: '#6b7280' }}>Select a project to view its analytics.</p>
        </div>
      )}
    </div>
  );
}

const badgeColor = {
  FREE: { background: '#1a1a2e', color: '#7c6fcd', border: '1px solid #7c6fcd' },
  PRO:  { background: '#14532d', color: '#4ade80', border: '1px solid #4ade80' },
  ENTERPRISE: { background: '#1e1b4b', color: '#818cf8', border: '1px solid #818cf8' },
};

const s = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' },
  heading: { fontSize: '24px', fontWeight: '700', color: '#fff', marginBottom: '4px' },
  sub: { color: '#6b7280', fontSize: '14px' },
  select: { background: '#1e1e2e', border: '1px solid #2a2a3a', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '14px', outline: 'none', minWidth: '220px' },
  errorBar: { background: '#2d1515', border: '1px solid #5c2626', color: '#f87171', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', marginBottom: '16px' },
  loadingWrap: { display: 'flex', alignItems: 'center', gap: '12px', padding: '40px 0' },
  spinner: { width: '20px', height: '20px', border: '2px solid #2a2a3a', borderTop: '2px solid #7c6fcd', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  muted: { color: '#4b5563', fontSize: '14px' },

  cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '14px', marginBottom: '24px' },
  card: { borderRadius: '12px', padding: '18px', border: '1px solid #1e1e2e' },
  cardValue: { fontSize: '22px', fontWeight: '700', marginBottom: '4px' },
  cardLabel: { color: '#6b7280', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' },

  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' },
  chartBox: { background: '#13131a', border: '1px solid #1e1e2e', borderRadius: '12px', padding: '24px', marginBottom: '20px' },
  chartTitle: { color: '#9ca3af', fontSize: '13px', fontWeight: '600', marginBottom: '16px', letterSpacing: '0.04em' },
  noData: { color: '#374151', fontSize: '13px', textAlign: 'center', padding: '30px 0' },
  tooltip: { background: '#13131a', border: '1px solid #2a2a3a', borderRadius: '8px', color: '#fff' },

  tableWrap: { overflow: 'hidden', borderRadius: '8px', border: '1px solid #1e1e2e' },
  tableHead: { background: '#0d0d14', color: '#4b5563', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em' },
  tableRow: { display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 0.8fr 1fr 1fr 1.2fr', padding: '11px 16px', borderTop: '1px solid #111118', alignItems: 'center', gap: '8px' },
  mono: { color: '#6b7280', fontSize: '11px', fontFamily: 'monospace' },
  cell: { color: '#9ca3af', fontSize: '12px' },
  planBadge: { borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: '600' },
  quotaBar: { height: '4px', background: '#1e1e2e', borderRadius: '2px', width: '80px', overflow: 'hidden', marginBottom: '3px' },
  quotaFill: { height: '4px', borderRadius: '2px', transition: 'width 0.4s ease' },

  tabs: { display: 'flex', gap: '4px' },
  tab: { padding: '5px 12px', borderRadius: '6px', border: '1px solid #2a2a3a', background: 'transparent', color: '#6b7280', fontSize: '12px', cursor: 'pointer' },
  tabActive: { background: '#7c6fcd20', color: '#7c6fcd', borderColor: '#7c6fcd' },

  okBadge: { color: '#4ade80', fontSize: '12px', background: '#14532d', borderRadius: '4px', padding: '2px 8px', display: 'inline-block' },
  errBadge: { color: '#f87171', fontSize: '12px', background: '#2d1515', borderRadius: '4px', padding: '2px 8px', display: 'inline-block' },

  empty: { textAlign: 'center', padding: '80px 20px' },
};