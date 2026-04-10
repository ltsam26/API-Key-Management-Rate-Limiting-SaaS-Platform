import { useEffect, useState } from 'react';
import { getApiKeys, toggleApiKey } from '../../services/admin.service';

export default function AdminKeys() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchKeys = () => {
    getApiKeys().then(res => {
      setKeys(res.data.keys);
      setLoading(false);
    }).catch(console.error);
  };

  useEffect(() => fetchKeys(), []);

  const handleToggle = async (id, currentState) => {
    await toggleApiKey(id, !currentState);
    fetchKeys();
  };

  return (
    <div>
      <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>Global API Keys</h1>
      <p style={{ color: '#9ca3af', marginBottom: '24px' }}>Monitor or remotely revoke any active API Key on the network.</p>
      
      {loading ? <p>Loading...</p> : (
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2a2a3a', color: '#9ca3af' }}>
              <th style={{ padding: '12px' }}>Key Prefix</th>
              <th style={{ padding: '12px' }}>Project</th>
              <th style={{ padding: '12px' }}>Owner Email</th>
              <th style={{ padding: '12px' }}>Status</th>
              <th style={{ padding: '12px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {keys.map(k => (
              <tr key={k.id} style={{ borderBottom: '1px solid #1e1e2e' }}>
                <td style={{ padding: '12px', fontSize: '12px', fontFamily: 'monospace', color: '#a89de0' }}>
                  {k.id.substring(0,24)}...
                </td>
                <td style={{ padding: '12px' }}>{k.project_name}</td>
                <td style={{ padding: '12px' }}>{k.owner_email}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ 
                     background: k.is_active ? '#14532d' : '#5c2626',
                     color: k.is_active ? '#4ade80' : '#f87171',
                     padding: '2px 8px', borderRadius: '12px', fontSize: '12px' 
                   }}>
                    {k.is_active ? 'Active' : 'Revoked / Disabled'}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <button 
                    onClick={() => handleToggle(k.id, k.is_active)}
                    style={{ background: 'transparent', border: '1px solid #a89de0', color: '#a89de0', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    {k.is_active ? 'Disable' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
