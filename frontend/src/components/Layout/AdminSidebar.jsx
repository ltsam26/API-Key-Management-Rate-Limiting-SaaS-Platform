import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import logoImgSrc from '../../assets/srsync.png';

const links = [
  { to: '/admin', label: 'Dashboard Overview', icon: '▦' },
  { to: '/admin/users', label: 'View Users', icon: '👤' },
  { to: '/admin/projects', label: 'View Projects', icon: '◫' },
  { to: '/admin/keys', label: 'API Keys & Revoke', icon: '⚿' },
  { to: '/admin/logs', label: 'Usage & Abuse Logs', icon: '▲' },
];

export default function AdminSidebar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside style={styles.sidebar}>
      <div style={styles.logo}>
        <img src={logoImgSrc} alt="SRSync Logo" style={styles.logoImg} />
        SRSync API <span style={{fontSize: '10px', color: '#f87171', border: '1px solid #f87171', borderRadius: '4px', padding: '2px 4px'}}>ADMIN</span>
      </div>

      <nav style={styles.nav}>
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/admin'}
            style={({ isActive }) => ({
              ...styles.link,
              ...(isActive ? styles.linkActive : {}),
            })}
          >
            <span style={styles.icon}>{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>

      <div style={styles.bottom}>
        <button 
          onClick={() => navigate('/dashboard')} 
          style={{...styles.logoutBtn, marginBottom: '8px', border: '1px solid #14532d', color: '#4ade80'}}
        >
          Return to User Portal
        </button>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          Sign out
        </button>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: '240px', minHeight: '100vh', background: '#2d1515', // reddish tint
    borderRight: '1px solid #5c2626', display: 'flex', flexDirection: 'column',
    padding: '24px 16px', position: 'fixed', top: 0, left: 0,
    fontFamily: "'Inter', sans-serif",
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: '8px',
    fontSize: '20px', fontWeight: '700', color: '#f87171',
    marginBottom: '36px', paddingLeft: '8px',
  },
  logoImg: { width: '28px', height: 'auto' },
  nav: { display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 },
  link: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '10px 12px', borderRadius: '8px', color: '#fca5a5',
    textDecoration: 'none', fontSize: '14px', fontWeight: '500', transition: 'all 0.15s',
  },
  linkActive: { background: '#451a1a', color: '#fff', borderLeft: '2px solid #f87171' },
  icon: { fontSize: '16px', width: '20px', textAlign: 'center' },
  bottom: { borderTop: '1px solid #5c2626', paddingTop: '16px' },
  logoutBtn: {
    width: '100%', padding: '9px', background: 'transparent',
    border: '1px solid #5c2626', borderRadius: '8px',
    color: '#fca5a5', fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s',
  },
};
