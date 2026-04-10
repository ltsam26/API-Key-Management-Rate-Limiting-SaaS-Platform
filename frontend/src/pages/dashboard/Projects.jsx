import { useEffect, useState } from 'react';
import { getProjects, createProject } from '../../services/project.service';
import { useNavigate } from 'react-router-dom';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  const fetchProjects = async () => {
    try {
      const res = await getProjects();
      setProjects(res.data.projects || res.data || []);
    } catch {
      setError('Failed to load projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      await createProject(name.trim());
      setName('');
      setShowForm(false);
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.heading}>Projects</h1>
          <p style={styles.sub}>Manage your API projects</p>
        </div>
        <button style={styles.btn} onClick={() => setShowForm(!showForm)}>
          + New Project
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={styles.form}>
          <input
            style={styles.input}
            placeholder="Project name (e.g. My Weather App)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <button style={styles.btn} disabled={creating}>
            {creating ? 'Creating...' : 'Create'}
          </button>
          <button type="button" style={styles.cancelBtn} onClick={() => setShowForm(false)}>
            Cancel
          </button>
        </form>
      )}

      {error && <div style={styles.error}>{error}</div>}

      {loading ? (
        <p style={styles.muted}>Loading projects...</p>
      ) : projects.length === 0 ? (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>◫</div>
          <p>No projects yet. Create your first one above.</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {projects.map((p) => (
            <div key={p.id} style={styles.card}>
              <div style={styles.cardTop}>
                <div style={styles.cardIcon}>◫</div>
                <div style={styles.cardName}>{p.name}</div>
              </div>
              <div style={styles.cardMeta}>
                <span style={styles.metaItem}>
                  Rate limit: <strong style={{ color: '#a89de0' }}>{p.rate_limit_per_minute} req/min</strong>
                </span>
                <span style={styles.metaItem}>
                  Max keys: <strong style={{ color: '#a89de0' }}>{p.max_api_keys}</strong>
                </span>
              </div>
              <div style={styles.cardId}>ID: {p.id.slice(0, 18)}...</div>
              <button
                style={styles.manageBtn}
                onClick={() => navigate(`/dashboard/keys?projectId=${p.id}`)}
              >
                Manage Keys →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' },
  heading: { fontSize: '24px', fontWeight: '700', color: '#fff', marginBottom: '4px' },
  sub: { color: '#6b7280', fontSize: '14px' },
  btn: {
    background: '#7c6fcd', color: '#fff', border: 'none',
    borderRadius: '8px', padding: '10px 18px',
    fontSize: '14px', fontWeight: '600', cursor: 'pointer',
  },
  cancelBtn: {
    background: 'transparent', color: '#6b7280',
    border: '1px solid #2a2a3a', borderRadius: '8px',
    padding: '10px 18px', fontSize: '14px', cursor: 'pointer',
  },
  form: {
    display: 'flex', gap: '10px', alignItems: 'center',
    background: '#13131a', border: '1px solid #1e1e2e',
    borderRadius: '12px', padding: '20px', marginBottom: '24px',
  },
  input: {
    flex: 1, background: '#1e1e2e', border: '1px solid #2a2a3a',
    borderRadius: '8px', padding: '10px 14px',
    color: '#fff', fontSize: '14px', outline: 'none',
  },
  error: {
    background: '#2d1515', border: '1px solid #5c2626',
    color: '#f87171', borderRadius: '8px',
    padding: '10px 14px', fontSize: '13px', marginBottom: '16px',
  },
  muted: { color: '#4b5563', fontSize: '14px' },
  empty: {
    textAlign: 'center', padding: '60px 20px',
    color: '#4b5563', fontSize: '15px',
  },
  emptyIcon: { fontSize: '40px', marginBottom: '12px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' },
  card: {
    background: '#13131a', border: '1px solid #1e1e2e',
    borderRadius: '12px', padding: '24px',
  },
  cardTop: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' },
  cardIcon: { fontSize: '20px', color: '#7c6fcd' },
  cardName: { fontSize: '16px', fontWeight: '600', color: '#fff' },
  cardMeta: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' },
  metaItem: { color: '#6b7280', fontSize: '13px' },
  cardId: { color: '#374151', fontSize: '11px', fontFamily: 'monospace', marginBottom: '16px' },
  manageBtn: {
    width: '100%', padding: '9px',
    background: '#1a1a2e', border: '1px solid #2a2550',
    borderRadius: '8px', color: '#a89de0',
    fontSize: '13px', fontWeight: '500', cursor: 'pointer',
  },
};