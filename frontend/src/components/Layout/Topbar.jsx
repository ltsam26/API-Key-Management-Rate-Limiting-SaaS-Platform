import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';

export default function Topbar() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <header style={styles.topbar}>
      <div style={styles.searchWrap}>
        <span style={styles.searchIcon}>🔍</span>
        <input 
          type="text" 
          placeholder="Search APIs, projects, or logs..." 
          style={styles.searchInput} 
        />
      </div>

      <div style={styles.actions}>
        <button style={styles.createBtn} onClick={() => navigate('/dashboard/projects')}>
          + Create Project
        </button>
        
        <button style={styles.iconBtn} onClick={toggleTheme} title="Toggle Theme">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        
        <button style={styles.iconBtn}>
          🔔
          <span style={styles.badge}>3</span>
        </button>
        
        <div style={styles.profileBox}>
          <div style={styles.avatar}>
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <span style={styles.userName}>{user?.email?.split('@')[0]}</span>
        </div>
      </div>
    </header>
  );
}

const styles = {
  topbar: {
    height: '70px',
    background: 'var(--bg-main)',
    borderBottom: '1px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 40px',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    transition: 'background 0.3s, border-color 0.3s',
  },
  searchWrap: {
    display: 'flex',
    alignItems: 'center',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '8px 16px',
    width: '320px',
    transition: 'background 0.3s, border-color 0.3s',
  },
  searchIcon: {
    fontSize: '14px',
    marginRight: '8px',
    color: 'var(--text-muted)',
  },
  searchInput: {
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: 'var(--text-main)',
    fontSize: '14px',
    width: '100%',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  createBtn: {
    background: '#7c6fcd',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  iconBtn: {
    background: 'transparent',
    border: '1px solid var(--border-color)',
    color: 'var(--text-dim)',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    position: 'relative',
    transition: 'border-color 0.3s, color 0.3s',
  },
  badge: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    background: '#ef4444',
    color: '#fff',
    fontSize: '10px',
    fontWeight: '700',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    paddingLeft: '20px',
    borderLeft: '1px solid var(--border-color)',
    transition: 'border-color 0.3s',
  },
  avatar: {
    width: '32px', 
    height: '32px',
    borderRadius: '50%',
    background: 'var(--border-light)',
    color: '#a89de0',
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    fontSize: '13px', 
    fontWeight: '700',
    transition: 'background 0.3s',
  },
  userName: {
    color: 'var(--text-main)',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'color 0.3s',
  }
};
