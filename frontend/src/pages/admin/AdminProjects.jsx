import { useEffect, useState } from 'react';
import { getProjects } from '../../services/admin.service';

export default function AdminProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProjects().then(res => {
      setProjects(res.data.projects);
      setLoading(false);
    }).catch(console.error);
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>Manage Projects</h1>
      <p style={{ color: '#9ca3af', marginBottom: '24px' }}>Overview of all user-created projects and their active plans.</p>
      
      {loading ? <p>Loading...</p> : (
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2a2a3a', color: '#9ca3af' }}>
              <th style={{ padding: '12px' }}>ID</th>
              <th style={{ padding: '12px' }}>Name</th>
              <th style={{ padding: '12px' }}>Owner Email</th>
              <th style={{ padding: '12px' }}>Plan</th>
              <th style={{ padding: '12px' }}>Created At</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #1e1e2e' }}>
                <td style={{ padding: '12px', fontSize: '12px', color: '#6b7280' }}>
                  {p.id.substring(0,8)}
                </td>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{p.name}</td>
                <td style={{ padding: '12px' }}>{p.owner_email}</td>
                <td style={{ padding: '12px', color: '#a89de0' }}>{p.plan}</td>
                <td style={{ padding: '12px', color: '#9ca3af' }}>
                  {new Date(p.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
