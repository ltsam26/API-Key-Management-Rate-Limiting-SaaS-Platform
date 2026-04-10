import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function LoginSuccess() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log("LoginSuccess: Component mounted. URL:", window.location.href);
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token) {
      console.log("LoginSuccess: Token found, initializing session...");
      login(token);
      console.log("LoginSuccess: Navigating to dashboard...");
      navigate('/dashboard', { replace: true });
    } else {
      console.warn("LoginSuccess: No token found in URL.");
      navigate('/login?error=no_token', { replace: true });
    }
  }, [login, navigate, location]);

  return (
    <div style={styles.container}>
      <div style={styles.loader}></div>
      <p style={styles.text}>Completing secure login...</p>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#0a0a0f',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Inter', sans-serif",
  },
  loader: {
    width: '40px',
    height: '40px',
    border: '3px solid #1e1e2e',
    borderTop: '3px solid #7c6fcd',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px',
  },
  text: {
    color: '#9ca3af',
    fontSize: '15px',
    fontWeight: '500',
  },
};

// Add global animation for the spinner
const styleSheet = document.createElement("style")
styleSheet.innerText = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);
