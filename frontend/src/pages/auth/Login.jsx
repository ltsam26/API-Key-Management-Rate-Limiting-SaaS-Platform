import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { loginUser } from '../../services/auth.service';
import logoImgSrc from '../../assets/srsync.png';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await loginUser(email, password);
      login(res.data.token);
      navigate('/dashboard');
    } catch (err) {
      if (!err.response) {
        setError(`Network error: ${err.message}. Backend base URL: ${import.meta.env.VITE_API_BASE_URL}`);
      } else {
        setError(err.response?.data?.message || 'Login failed. Check credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <img src={logoImgSrc} alt="SRSync Logo" style={styles.logoImg} />
          SRSync API
        </div>
        <h2 style={styles.title}>Welcome back</h2>
        <p style={styles.sub}>Sign in to your dashboard</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button style={loading ? styles.btnDisabled : styles.btn} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div style={styles.divider}>
          <span style={styles.dividerLine}></span>
          <span style={styles.dividerText}>or continue with</span>
          <span style={styles.dividerLine}></span>
        </div>

        <div style={styles.oauthGroup}>
          <button 
            onClick={() => window.location.href = `${import.meta.env.VITE_API_BASE_URL}/api/auth/google`} 
            style={styles.oauthBtn}
          >
            <img src="https://img.icons8.com/color/24/000000/google-logo.png" alt="Google" style={styles.oauthIcon} />
            Google
          </button>
          
          <button 
            onClick={() => window.location.href = `${import.meta.env.VITE_API_BASE_URL}/api/auth/github`} 
            style={styles.oauthBtn}
          >
            <img src="https://img.icons8.com/ios-glyphs/24/ffffff/github.png" alt="GitHub" style={styles.oauthIcon} />
            GitHub
          </button>
        </div>

        <p style={styles.footer}>
          Don't have an account?{' '}
          <Link to="/signup" style={styles.link}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0a0a0f',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Inter', sans-serif",
  },
  card: {
    background: '#13131a',
    border: '1px solid #2a2a3a',
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '420px',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '22px',
    fontWeight: '700',
    color: '#7c6fcd',
    marginBottom: '24px',
    letterSpacing: '-0.5px',
  },
  logoImg: {
    width: '32px',
    height: 'auto',
  },
  title: {
    color: '#ffffff',
    fontSize: '24px',
    fontWeight: '600',
    margin: '0 0 6px',
  },
  sub: {
    color: '#6b7280',
    fontSize: '14px',
    margin: '0 0 28px',
  },
  error: {
    background: '#2d1515',
    border: '1px solid #5c2626',
    color: '#f87171',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '13px',
    marginBottom: '16px',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { color: '#9ca3af', fontSize: '13px', fontWeight: '500' },
  input: {
    background: '#1e1e2e',
    border: '1px solid #2a2a3a',
    borderRadius: '8px',
    padding: '11px 14px',
    color: '#ffffff',
    fontSize: '14px',
    outline: 'none',
    transition: 'border 0.2s',
  },
  btn: {
    marginTop: '8px',
    background: '#7c6fcd',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  btnDisabled: {
    marginTop: '8px',
    background: '#3d3660',
    color: '#aaa',
    border: 'none',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'not-allowed',
  },
  footer: { textAlign: 'center', color: '#6b7280', fontSize: '13px', marginTop: '24px' },
  link: { color: '#7c6fcd', textDecoration: 'none', fontWeight: '500' },
  divider: { display: 'flex', alignItems: 'center', margin: '24px 0', gap: '12px' },
  dividerLine: { flex: 1, height: '1px', background: '#2a2a3a' },
  dividerText: { color: '#6b7280', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  oauthGroup: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  oauthBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
    background: '#1e1e2e', border: '1px solid #2a2a3a', borderRadius: '8px',
    padding: '10px', color: '#fff', fontSize: '14px', fontWeight: '500', 
    cursor: 'pointer', transition: 'all 0.2s'
  },
  oauthIcon: { width: '18px', height: '18px' }
};