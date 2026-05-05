import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import logoImgSrc from '../../assets/srsync.png';

const links = [
  { to: '/dashboard', label: 'Overview', icon: '▦' },
  { to: '/dashboard/projects', label: 'Projects', icon: '◫' },
  { to: '/dashboard/keys', label: 'API Keys', icon: '⚿' },
  { to: '/dashboard/analytics', label: 'Analytics', icon: '▲' },
  { to: '/dashboard/billing', label: 'Subscriptions', icon: '💳' },
  { to: '/dashboard/support', label: 'Support', icon: '💬' },
];

export default function Sidebar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside style={styles.sidebar}>
      <div style={styles.logoRow}>
        <img src={logoImgSrc} alt="SRSync Logo" style={styles.logoImg} />
        SRSync API
      </div>

      <div style={styles.workspaceSelector}>
        <div style={styles.workspaceBox}>
          <div style={styles.workspaceAvatar}>
            {(user?.email?.[0] || 'M').toUpperCase()}
          </div>
          <div style={styles.workspaceInfo}>
            <div style={styles.workspaceName}>{user?.email?.split('@')[0]}'s Workspace</div>
            <div style={styles.workspacePlan}>PRO PLAN</div>
          </div>
          <div style={styles.workspaceArrow}>▼</div>
        </div>
      </div>

      <nav style={styles.nav}>
        <div style={styles.navSectionTitle}>MAIN MENU</div>
        {links.map((l) => (
          <NavLink
            key={l.label}
            to={l.to}
            end={l.to === '/dashboard'}
            style={({ isActive }) => ({
              ...styles.link,
              ...(isActive && l.to !== '#' ? styles.linkActive : {}),
              ...(l.to === '#' ? { opacity: 0.6, cursor: 'not-allowed' } : {})
            })}
          >
            <span style={styles.icon}>{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>

      <div style={styles.bottom}>
        {user?.role === 'admin' && (
          <button onClick={() => navigate('/admin')} style={{...styles.logoutBtn, marginBottom: '8px', color: '#fca5a5', border: '1px solid #5c2626'}}>
            Switch to Admin Panel
          </button>
        )}
        <button onClick={handleLogout} style={styles.logoutBtn}>
           Sign out
        </button>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: '260px',
    minHeight: '100vh',
    background: 'var(--bg-sidebar)',
    borderRight: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 20px',
    position: 'fixed',
    top: 0,
    left: 0,
    fontFamily: "'Inter', sans-serif",
    transition: 'background 0.3s, border-color 0.3s',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '22px',
    fontWeight: '700',
    color: '#7c6fcd',
    marginBottom: '32px',
    paddingLeft: '4px',
  },
  logoImg: { width: '32px', height: 'auto' },
  workspaceSelector: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-light)',
    borderRadius: '10px',
    padding: '12px',
    marginBottom: '32px',
    cursor: 'pointer',
    transition: 'background 0.3s, border-color 0.3s',
  },
  workspaceBox: {
    display: 'flex', alignItems: 'center', gap: '12px'
  },
  workspaceAvatar: {
    width: '32px', height: '32px', borderRadius: '6px',
    background: 'linear-gradient(135deg, #7c6fcd, #a89de0)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: '700', fontSize: '14px'
  },
  workspaceInfo: { flex: 1, overflow: 'hidden' },
  workspaceName: { color: 'var(--text-main)', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' },
  workspacePlan: { color: '#4ade80', fontSize: '10px', fontWeight: '800', letterSpacing: '0.05em', marginTop: '2px' },
  workspaceArrow: { color: 'var(--text-muted)', fontSize: '10px' },

  nav: { display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 },
  navSectionTitle: { color: 'var(--text-muted)', fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', marginBottom: '12px', paddingLeft: '8px' },
  link: {
    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
    borderRadius: '8px', color: 'var(--text-dim)', textDecoration: 'none',
    fontSize: '14px', fontWeight: '500', transition: 'all 0.2s',
  },
  linkActive: {
    background: 'var(--bg-fade)',
    color: '#7c6fcd',
    borderRight: '3px solid #7c6fcd',
    fontWeight: '600'
  },
  icon: { fontSize: '17px', width: '20px', textAlign: 'center' },
  bottom: { borderTop: '1px solid var(--border-color)', paddingTop: '20px' },
  logoutBtn: {
    width: '100%', padding: '10px', background: 'transparent',
    border: '1px solid var(--border-light)', borderRadius: '8px',
    color: 'var(--text-muted)', fontSize: '13px', fontWeight: '500', cursor: 'pointer',
  },
};