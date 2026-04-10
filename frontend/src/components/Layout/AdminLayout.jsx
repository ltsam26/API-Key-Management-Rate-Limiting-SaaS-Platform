import AdminSidebar from './AdminSidebar';
import { Outlet } from 'react-router-dom';

export default function AdminLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0f' }}>
      <AdminSidebar />
      <main style={{
        marginLeft: '240px',
        flex: 1,
        padding: '36px 40px',
        fontFamily: "'Inter', sans-serif",
        color: '#ffffff',
      }}>
        <Outlet />
      </main>
    </div>
  );
}
