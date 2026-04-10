import { useEffect, useState } from 'react';
import { getSystemStats } from '../../services/admin.service';

export default function AdminOverview() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getSystemStats().then(res => setStats(res.data.stats)).catch(console.error);
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: '24px', marginBottom: '24px' }}>System Overview</h1>
      <div style={{ display: 'flex', gap: '20px' }}>
        <StatCard title="Total Users" value={stats?.users || 0} />
        <StatCard title="Projects" value={stats?.projects || 0} />
        <StatCard title="API Keys" value={stats?.apiKeys || 0} />
        <StatCard title="Total API Calls" value={stats?.apiCalls || 0} />
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div style={{ background: '#1e1e2e', padding: '24px', borderRadius: '12px', flex: 1, border: '1px solid #2a2a3a' }}>
      <div style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>{title}</div>
      <div style={{ color: '#fff', fontSize: '32px', fontWeight: 'bold' }}>{value}</div>
    </div>
  );
}
