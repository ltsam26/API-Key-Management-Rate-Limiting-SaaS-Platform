import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { Outlet } from 'react-router-dom';
import AIAssistant from '../UI/AIAssistant';

export default function DashboardLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)', transition: 'background 0.3s' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: '260px', display: 'flex', flexDirection: 'column' }}>
        <Topbar />
        <main style={{
          flex: 1,
          padding: '36px 40px',
          fontFamily: "'Inter', sans-serif",
          color: 'var(--text-main)',
          transition: 'color 0.3s',
        }}>
          <Outlet />
        </main>
      </div>

      {/* AI Assistant — available on every dashboard page */}
      <AIAssistant />
    </div>
  );
}