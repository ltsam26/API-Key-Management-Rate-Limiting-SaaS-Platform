import { useEffect, useState } from 'react';
import { getUsers } from '../../services/admin.service';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUsers().then(res => {
      setUsers(res.data.users);
      setLoading(false);
    }).catch(console.error);
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>Manage Users</h1>
      <p style={{ color: '#9ca3af', marginBottom: '24px' }}>View all signups and plan tiers.</p>
      
      {loading ? <p>Loading...</p> : (
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2a2a3a', color: '#9ca3af' }}>
              <th style={{ padding: '12px' }}>ID</th>
              <th style={{ padding: '12px' }}>Email</th>
              <th style={{ padding: '12px' }}>Role</th>
              <th style={{ padding: '12px' }}>Plan</th>
              <th style={{ padding: '12px' }}>Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #1e1e2e' }}>
                <td style={{ padding: '12px', fontSize: '12px', color: '#6b7280' }}>
                  {u.id.substring(0,8)}
                </td>
                <td style={{ padding: '12px' }}>{u.email}</td>
                <td style={{ padding: '12px' }}>
                   <span style={{ 
                     background: u.role === 'admin' ? '#5c2626' : '#14532d',
                     color: u.role === 'admin' ? '#fca5a5' : '#86efac',
                     padding: '2px 8px', borderRadius: '12px', fontSize: '12px' 
                   }}>{u.role}</span>
                </td>
                <td style={{ padding: '12px', color: '#a89de0' }}>{u.plan_type}</td>
                <td style={{ padding: '12px', color: '#9ca3af' }}>
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
