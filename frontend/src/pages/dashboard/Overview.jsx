import { useAuth } from '../../hooks/useAuth';
import { useState, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../api/axios';

export default function Overview() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/analytics/user/overview')
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={styles.loadingWrap}>
        <div style={styles.spinner} />
        <p style={styles.muted}>Loading overview...</p>
      </div>
    );
  }

  const metrics = data?.metrics || { totalRequests: 0, totalErrors: 0, rateLimitsHit: 0, costEstimate: '0.00' };
  const dailyTrend = (data?.dailyTrend || []).map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    requests: parseInt(d.requests)
  }));
  const consumption = (data?.projectConsumption || []).map(p => ({
    name: p.project, tokens: parseInt(p.tokens)
  }));
  const activity = data?.recentActivity || [];

  return (
    <div style={{ paddingBottom: '60px' }}>
      <h1 style={styles.heading}>
        Overview Dashboard
      </h1>
      <p style={styles.sub}>High-level summary of system performance, usage, and operational insights.</p>

      {/* 3. Performance Metrics (Top Cards) */}
      <div style={styles.cards}>
        {[
          { label: 'Total Requests', value: metrics.totalRequests.toLocaleString(), trend: '+12%', color: '#7c6fcd' },
          { label: 'API Errors (4xx/5xx)', value: metrics.totalErrors.toLocaleString(), trend: '-5%', color: '#ef4444' },
          { label: 'Rate Limits Hit', value: metrics.rateLimitsHit.toLocaleString(), trend: '+2%', color: '#f59e0b' },
          { label: 'Cost Estimate', value: '$' + metrics.costEstimate, trend: 'Stable', color: '#10b981' },
        ].map((c) => (
          <div key={c.label} style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ ...styles.cardValue, color: c.color }}>{c.value}</div>
              <span style={{ fontSize: '12px', color: c.trend.includes('-') || c.trend === 'Stable' ? '#4ade80' : '#f87171', background: 'var(--bg-fade)', padding: '2px 8px', borderRadius: '12px' }}>
                {c.trend}
              </span>
            </div>
            <div style={styles.cardLabel}>{c.label}</div>
          </div>
        ))}
      </div>

      <div style={styles.twoCol}>
        {/* 4. Performance Over Time */}
        <div style={styles.sectionCard}>
          <div style={styles.sectionHeader}>📈 Performance Over Time</div>
          <div style={{ height: '240px' }}>
            {dailyTrend.length === 0 ? <p style={styles.noData}>No data available</p> : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTrend}>
                  <defs>
                    <linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c6fcd" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7c6fcd" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#1e1e2e" strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={styles.tooltip} />
                  <Area type="monotone" dataKey="requests" stroke="#7c6fcd" strokeWidth={2} fill="url(#areaColor)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 5. Cost / Token Consumption */}
        <div style={styles.sectionCard}>
          <div style={styles.sectionHeader}>💰 Token Consumption</div>
          <div style={{ height: '240px' }}>
            {consumption.length === 0 ? <p style={styles.noData}>No data available</p> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={consumption}>
                  <CartesianGrid stroke="#1e1e2e" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={styles.tooltip} cursor={{ fill: '#1e1e2e' }} />
                  <Bar dataKey="tokens" fill="#10b981" radius={[4,4,0,0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* 6. Calendar / Activity Section */}
      <div style={styles.sectionCard}>
        <div style={styles.sectionHeader}>📅 Recent System Activity</div>
        {activity.length === 0 ? <p style={styles.noData}>No recent activity</p> : (
          <div style={styles.activityFeed}>
            {activity.map((act, i) => (
              <div key={i} style={styles.activityRow}>
                <div style={{ ...styles.actBadge, background: act.status_code >= 400 ? '#2d1515' : '#14532d', color: act.status_code >= 400 ? '#f87171' : '#4ade80' }}>
                  {act.status_code}
                </div>
                <div style={styles.actInfo}>
                  <div style={{ fontSize: '13px', fontWeight: '500' }}>{act.method} {act.endpoint}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Project: {act.project_name}</div>
                </div>
                <div style={styles.actTime}>
                  {new Date(act.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 7. AI Assistant hint */}
      <div style={{ textAlign: 'center', marginTop: '12px', color: 'var(--text-muted)', fontSize: '12px' }}>
        💡 Tip: Use the <strong style={{ color: '#a89de0' }}>✦ AI Assistant</strong> (bottom-right) to analyze your usage, debug errors, or get API guidance.
      </div>
    </div>
  );
}

const styles = {
  heading: { fontSize: '24px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px', transition: 'color 0.3s' },
  sub: { color: 'var(--text-muted)', fontSize: '14px', marginBottom: '28px', transition: 'color 0.3s' },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' },
  card: {
    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
    borderRadius: '12px', padding: '20px', transition: 'background 0.3s, border-color 0.3s'
  },
  cardValue: { fontSize: '26px', fontWeight: '700', marginBottom: '6px' },
  cardLabel: { color: 'var(--text-muted)', fontSize: '13px', fontWeight: '500' },
  
  twoCol: { display: 'grid', gridTemplateColumns: '2fr 1.5fr', gap: '20px', marginBottom: '24px' },
  sectionCard: {
    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
    borderRadius: '12px', padding: '20px', transition: 'background 0.3s, border-color 0.3s'
  },
  sectionHeader: { color: 'var(--text-main)', fontSize: '14px', fontWeight: '600', marginBottom: '16px', letterSpacing: '0.02em' },
  tooltip: { background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-main)' },
  noData: { color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', paddingTop: '40px' },

  activityFeed: { display: 'flex', flexDirection: 'column', gap: '12px' },
  activityRow: {
    display: 'flex', alignItems: 'center', gap: '16px',
    padding: '12px', background: 'var(--bg-main)', borderRadius: '8px',
    border: '1px solid var(--border-color)', transition: 'background 0.3s, border-color 0.3s'
  },
  actBadge: { padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' },
  actInfo: { flex: 1 },
  actTime: { color: 'var(--text-muted)', fontSize: '12px' },

  loadingWrap: { display: 'flex', alignItems: 'center', gap: '12px', padding: '40px 0' },
  spinner: { width: '20px', height: '20px', border: '2px solid #2a2a3a', borderTop: '2px solid #7c6fcd', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  muted: { color: 'var(--text-muted)', fontSize: '14px' },
};