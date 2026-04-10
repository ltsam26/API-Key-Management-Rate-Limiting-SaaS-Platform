import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getProjects } from '../../services/project.service';
import { 
  getKeys, generateKey, revokeKey, rotateKey, 
  setSecurity, setSettings, getKeyUsage, getKeyLogs
} from '../../services/apikey.service';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ApiKeys() {
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(searchParams.get('projectId') || '');
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // UI States
  const [newKey, setNewKey] = useState(null);
  const [copied, setCopied] = useState(false);
  const [expandedKey, setExpandedKey] = useState(null);
  
  // Modal States
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  
  useEffect(() => {
    getProjects().then((res) => {
      const list = res.data.projects || res.data || [];
      setProjects(list);
      if (!selectedProject && list.length > 0) setSelectedProject(list[0].id);
    });
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [selectedProject]);

  const fetchKeys = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getKeys();
      let allKeys = res.data.keys || [];
      if (selectedProject) {
        allKeys = allKeys.filter(k => k.project_id === selectedProject || k.project_name);
      }
      setKeys(allKeys);
    } catch {
      setError('Failed to load keys.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data) => {
    try {
      const res = await generateKey(selectedProject || projects[0]?.id, data);
      setNewKey(res.data.apiKey);
      setShowGenerateModal(false);
      fetchKeys();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate key');
    }
  };

  const handleRevoke = async (keyId) => {
    if (!window.confirm('Revoke this key? It will stop working immediately.')) return;
    try {
      await revokeKey(keyId);
      fetchKeys();
    } catch {
      alert('Failed to revoke key.');
    }
  };

  const handleRotate = async (keyId) => {
    if (!window.confirm('Rotate this key? The old key will be invalidated immediately.')) return;
    try {
      const res = await rotateKey(keyId);
      setNewKey(res.data.newApiKey);
      fetchKeys();
    } catch {
      alert('Failed to rotate key.');
    }
  };

  const copyToClipboard = async (text, setCopiedState) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
    }
    if(setCopiedState) {
      setCopiedState(true);
      setTimeout(() => setCopiedState(false), 2000);
    }
  };

  const toggleExpand = (keyId) => {
    setExpandedKey(expandedKey === keyId ? null : keyId);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.heading}>API Keys</h1>
          <p style={styles.sub}>Manage authentication, usage, and security for your applications</p>
        </div>
        <button style={styles.btnPrimary} onClick={() => setShowGenerateModal(true)}>
          + Generate New Key
        </button>
      </div>

      <div style={styles.filters}>
        <select 
          style={styles.select} 
          value={selectedProject} 
          onChange={(e) => setSelectedProject(e.target.value)}
        >
          <option value="">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {newKey && (
        <div style={styles.newKeyBanner}>
          <div style={styles.newKeyHeader}>
            <span>🔑 Key Generated Successfully! Copy it now, you won't see it again.</span>
            <button style={styles.btnOutlineSuccess} onClick={() => copyToClipboard(newKey, setCopied)}>
              {copied ? '✓ Copied' : 'Copy Key'}
            </button>
          </div>
          <code style={styles.newKeyCode}>{newKey}</code>
        </div>
      )}

      {error && <div style={styles.errorBanner}>{error}</div>}

      <div style={styles.tableCard}>
        {loading ? (
          <div style={styles.loading}>Loading keys...</div>
        ) : keys.length === 0 ? (
          <div style={styles.empty}>No keys found. Generate one to get started.</div>
        ) : (
          <div style={styles.table}>
            <div style={styles.th}>
              <span>Name / ID</span>
              <span>Project</span>
              <span>Permissions</span>
              <span>Status</span>
              <span>Last Used</span>
              <span>Actions</span>
            </div>
            {keys.map(k => (
              <div key={k.id} style={styles.trWrapper}>
                <div style={styles.tr}>
                  <div>
                    <div style={styles.keyName}>{k.name || 'API Key'}</div>
                    <div style={styles.keyIdHint} onClick={() => copyToClipboard(k.id)} title="Copy ID">
                      {k.id.slice(0, 8)}...{k.id.slice(-4)} ⎘
                    </div>
                  </div>
                  <div style={styles.tdText}>{k.project_name || 'N/A'}</div>
                  <div style={styles.tdText}>
                    {Array.isArray(k.permissions) ? k.permissions.join(', ') : 'All'}
                  </div>
                  <div>
                    <span style={k.is_active ? styles.badgeActive : styles.badgeInactive}>
                      {k.is_active ? 'Active' : 'Revoked'}
                    </span>
                  </div>
                  <div style={styles.tdText}>
                    {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'Never'}
                  </div>
                  <div style={styles.actionBtns}>
                    <button style={styles.btnAction} onClick={() => toggleExpand(k.id)}>
                      {expandedKey === k.id ? 'Hide Settings' : 'Manage'}
                    </button>
                    {k.is_active && (
                      <button style={{...styles.btnAction, color: '#f87171'}} onClick={() => handleRevoke(k.id)}>Revoke</button>
                    )}
                  </div>
                </div>

                {expandedKey === k.id && (
                  <ExpandedPanel 
                    apiKey={k} 
                    onRotate={() => handleRotate(k.id)}
                    onRefresh={fetchKeys}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showGenerateModal && (
        <GenerateKeyModal 
          onClose={() => setShowGenerateModal(false)}
          onSubmit={handleCreate}
        />
      )}
    </div>
  );
}

// Subcomponents
function ExpandedPanel({ apiKey, onRotate, onRefresh }) {
  const [activeTab, setActiveTab] = useState('settings');

  return (
    <div style={styles.expandedPanel}>
      <div style={styles.tabs}>
        <div 
          style={activeTab === 'settings' ? styles.tabActive : styles.tab} 
          onClick={() => setActiveTab('settings')}
        >Security & Settings</div>
        <div 
          style={activeTab === 'usage' ? styles.tabActive : styles.tab} 
          onClick={() => setActiveTab('usage')}
        >Usage Analytics</div>
        <div 
          style={activeTab === 'logs' ? styles.tabActive : styles.tab} 
          onClick={() => setActiveTab('logs')}
        >Request Logs</div>
      </div>

      <div style={styles.panelContent}>
        {activeTab === 'settings' && <KeySettingsForm apiKey={apiKey} onRotate={onRotate} onRefresh={onRefresh} />}
        {activeTab === 'usage' && <KeyUsageChart apiKeyId={apiKey.id} />}
        {activeTab === 'logs' && <KeyLogsTable apiKeyId={apiKey.id} />}
      </div>
    </div>
  );
}

function KeySettingsForm({ apiKey, onRotate, onRefresh }) {
  const [allowedIps, setAllowedIps] = useState(apiKey.allowed_ips ? apiKey.allowed_ips.join(', ') : '');
  const [saving, setSaving] = useState(false);

  const handleSaveIps = async () => {
    setSaving(true);
    try {
      const ips = allowedIps.split(',').map(s => s.trim()).filter(Boolean);
      await setSecurity(apiKey.id, ips);
      alert('Security updated!');
      onRefresh();
    } catch {
      alert('Failed to update security');
    }
    setSaving(false);
  };

  return (
    <div style={styles.settingsGrid}>
      <div style={styles.settingCard}>
        <h4 style={styles.settingHeading}>IP Restrictions</h4>
        <p style={styles.settingSub}>Restrict API key usage to specific IP addresses (comma separated)</p>
        <input 
          style={styles.input} 
          value={allowedIps} 
          onChange={e => setAllowedIps(e.target.value)} 
          placeholder="e.g. 192.168.1.1, 10.0.0.5" 
          disabled={!apiKey.is_active}
        />
        <button style={styles.btnOutline} disabled={saving || !apiKey.is_active} onClick={handleSaveIps}>
          {saving ? 'Saving...' : 'Save IPs'}
        </button>
      </div>

      <div style={styles.settingCard}>
        <h4 style={styles.settingHeading}>Danger Zone</h4>
        <p style={styles.settingSub}>Rotating validates a new key and immediately disables the old one.</p>
        <button style={styles.btnDanger} disabled={!apiKey.is_active} onClick={onRotate}>
          Rotate API Key
        </button>
      </div>
    </div>
  );
}

function KeyUsageChart({ apiKeyId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getKeyUsage(apiKeyId).then(res => {
      setData(res.data.usage || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [apiKeyId]);

  if (loading) return <div style={styles.muted}>Loading usage...</div>;
  if (!data.length) return <div style={styles.empty}>No usage data in the last 30 days.</div>;

  return (
    <div style={{ height: 250, width: '100%', marginTop: '10px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7c6fcd" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#7c6fcd" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" vertical={false} />
          <XAxis dataKey="date" stroke="#6b7280" fontSize={11} tickFormatter={(t) => new Date(t).getDate()} />
          <YAxis stroke="#6b7280" fontSize={11} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e1e2e', border: 'none', borderRadius: '8px', color: '#fff' }} 
            labelFormatter={(t) => new Date(t).toLocaleDateString()}
          />
          <Area type="monotone" dataKey="requests" name="Total Requests" stroke="#7c6fcd" fillOpacity={1} fill="url(#colorReq)" />
          <Area type="monotone" dataKey="errors" name="Errors" stroke="#f87171" fill="#f87171" fillOpacity={0.5} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function KeyLogsTable({ apiKeyId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getKeyLogs(apiKeyId).then(res => {
      setLogs(res.data.logs || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [apiKeyId]);

  if (loading) return <div style={styles.muted}>Loading logs...</div>;
  if (!logs.length) return <div style={styles.empty}>No recent logs found.</div>;

  return (
    <div style={styles.logTable}>
      <div style={styles.logTh}>
        <span>Method</span>
        <span>Endpoint</span>
        <span>Status</span>
        <span>Time</span>
      </div>
      {logs.map(log => (
        <div key={log.id} style={styles.logTr}>
          <span style={{color: log.method === 'POST' ? '#a89de0' : '#4ade80', fontWeight: 'bold'}}>{log.method}</span>
          <span style={styles.logTd}>{log.endpoint}</span>
          <span style={{color: log.status_code >= 400 ? '#f87171' : '#4ade80'}}>{log.status_code}</span>
          <span style={styles.logTd}>{new Date(log.created_at).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

function GenerateKeyModal({ onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [permissions, setPermissions] = useState('all');
  const [expiry, setExpiry] = useState('');

  const submit = (e) => {
    e.preventDefault();
    onSubmit({
      name,
      permissions: [permissions],
      expiresAt: expiry || null
    });
  };

  return (
    <div style={styles.modalBackdrop}>
      <div style={styles.modalContent}>
        <h2 style={styles.modalHeading}>Generate New API Key</h2>
        <form onSubmit={submit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Key Name</label>
            <input required style={styles.input} value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Production Key" />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Permissions</label>
            <select style={styles.select} value={permissions} onChange={e=>setPermissions(e.target.value)}>
              <option value="all">Full Access</option>
              <option value="read_only">Read Only</option>
            </select>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Expiry (Optional)</label>
            <input type="date" style={styles.input} value={expiry} onChange={e=>setExpiry(e.target.value)} />
          </div>
          <div style={styles.modalActions}>
            <button type="button" style={styles.btnGhost} onClick={onClose}>Cancel</button>
            <button type="submit" style={styles.btnPrimary}>Generate</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Styles
const styles = {
  container: { paddingBottom: '40px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  heading: { fontSize: '26px', fontWeight: 'bold', color: '#fff', margin: 0 },
  sub: { color: '#9ca3af', margin: '6px 0 0 0', fontSize: '14px' },
  btnPrimary: { background: '#7c6fcd', color: '#fff', padding: '10px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '500' },
  btnGhost: { background: 'transparent', color: '#9ca3af', padding: '10px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer' },
  btnOutline: { background: 'transparent', color: '#fff', border: '1px solid #3b3b4f', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer' },
  btnOutlineSuccess: { background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', border: '1px solid #166534', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer' },
  btnDanger: { background: 'rgba(248, 113, 113, 0.1)', color: '#f87171', border: '1px solid #7f1d1d', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer' },
  btnAction: { background: '#1e1e2e', border: '1px solid #2a2a3a', color: '#e5e7eb', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  filters: { marginBottom: '24px' },
  select: { background: '#1e1e2e', border: '1px solid #2a2a3a', color: '#fff', padding: '10px', borderRadius: '8px', outline: 'none', minWidth: '200px' },
  input: { background: '#0a0a0f', border: '1px solid #2a2a3a', color: '#fff', padding: '10px', borderRadius: '8px', outline: 'none', width: '100%', boxSizing:'border-box', marginBottom: '10px' },
  newKeyBanner: { background: '#0a0a0f', border: '1px solid #14532d', borderRadius: '12px', padding: '20px', marginBottom: '24px' },
  newKeyHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', color: '#4ade80', fontSize: '14px' },
  newKeyCode: { display: 'block', background: '#000', padding: '16px', borderRadius: '8px', color: '#a3e635', fontFamily: 'monospace', wordBreak: 'break-all', fontSize: '15px' },
  errorBanner: { background: 'rgba(248,113,113,0.1)', color: '#f87171', padding: '14px', borderRadius: '8px', border: '1px solid #7f1d1d', marginBottom: '24px' },
  tableCard: { background: '#13131a', border: '1px solid #1e1e2e', borderRadius: '12px', overflow: 'hidden' },
  th: { display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1.5fr', padding: '16px 20px', background: '#181822', borderBottom: '1px solid #2a2a3a', color: '#9ca3af', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' },
  empty: { padding: '40px', textAlign: 'center', color: '#6b7280' },
  loading: { padding: '40px', textAlign: 'center', color: '#6b7280' },
  trWrapper: { borderBottom: '1px solid #1e1e2e' },
  tr: { display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1.5fr', padding: '16px 20px', alignItems: 'center' },
  keyName: { color: '#fff', fontWeight: '500', fontSize: '14px', marginBottom: '4px' },
  keyIdHint: { color: '#6b7280', fontSize: '12px', fontFamily: 'monospace', cursor: 'pointer' },
  tdText: { color: '#9ca3af', fontSize: '14px' },
  badgeActive: { background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' },
  badgeInactive: { background: 'rgba(248, 113, 113, 0.1)', color: '#f87171', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' },
  actionBtns: { display: 'flex', gap: '8px' },
  expandedPanel: { background: '#0a0a0f', borderTop: '1px solid #1e1e2e', padding: '0' },
  tabs: { display: 'flex', borderBottom: '1px solid #1e1e2e', padding: '0 20px' },
  tab: { padding: '16px 20px', color: '#6b7280', cursor: 'pointer', fontSize: '14px', fontWeight: '500' },
  tabActive: { padding: '16px 20px', color: '#7c6fcd', cursor: 'pointer', fontSize: '14px', fontWeight: '500', borderBottom: '2px solid #7c6fcd' },
  panelContent: { padding: '24px' },
  settingsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
  settingCard: { background: '#13131a', border: '1px solid #1e1e2e', padding: '20px', borderRadius: '12px' },
  settingHeading: { color: '#fff', margin: '0 0 8px 0', fontSize: '16px' },
  settingSub: { color: '#6b7280', margin: '0 0 16px 0', fontSize: '13px' },
  modalBackdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 },
  modalContent: { background: '#13131a', border: '1px solid #2a2a3a', borderRadius: '16px', padding: '30px', width: '100%', maxWidth: '440px' },
  modalHeading: { color: '#fff', margin: '0 0 24px 0', fontSize: '20px' },
  formGroup: { marginBottom: '20px' },
  label: { display: 'block', color: '#9ca3af', marginBottom: '8px', fontSize: '13px' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '30px' },
  muted: { color: '#6b7280', textAlign: 'center', padding: '40px' },
  logTable: { background: '#000', borderRadius: '8px', overflow: 'hidden' },
  logTh: { display: 'grid', gridTemplateColumns: '1fr 3fr 1fr 2.5fr', padding: '12px 16px', background: '#111', color: '#6b7280', fontSize: '12px', fontWeight: 'bold' },
  logTr: { display: 'grid', gridTemplateColumns: '1fr 3fr 1fr 2.5fr', padding: '12px 16px', borderBottom: '1px solid #111', fontSize: '13px', alignItems: 'center' },
  logTd: { color: '#9ca3af', fontFamily: 'monospace' }
};