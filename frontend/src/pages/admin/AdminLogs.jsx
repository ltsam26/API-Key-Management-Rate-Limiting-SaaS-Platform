import { useEffect, useState } from 'react';
import { getUsageLogs } from '../../services/admin.service';

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUsageLogs().then(res => {
      setLogs(res.data.logs);
      setLoading(false);
    }).catch(console.error);
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>Security & Abuse Logs</h1>
      <p style={{ color: '#9ca3af', marginBottom: '24px' }}>A live stream of API requests spanning the entire platform.</p>
      
      {loading ? <p>Loading...</p> : (
        <div style={{ background: '#0a0a0f', padding: '16px', borderRadius: '8px', border: '1px solid #1e1e2e' }}>
          {logs.map(log => (
            <div key={log.id} style={{ display: 'flex', gap: '16px', padding: '8px 0', borderBottom: '1px solid #111118', fontSize: '13px', fontFamily: 'monospace' }}>
              <span style={{ color: '#6b7280' }}>
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span style={{ color: log.status_code >= 400 ? '#f87171' : '#4ade80', fontWeight: 'bold' }}>
                HTTP {log.status_code}
              </span>
              <span style={{ color: '#9ca3af' }}>{log.email}</span>
              <span style={{ color: '#6b7280' }}>IP: {log.ip_address}</span>
            </div>
          ))}
          {logs.length === 0 && <p style={{ color: '#6b7280' }}>No logs yet. Try calling an API.</p>}
        </div>
      )}
    </div>
  );
}
