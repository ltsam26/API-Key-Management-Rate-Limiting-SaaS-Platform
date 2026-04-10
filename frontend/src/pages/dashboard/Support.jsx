import { useState } from 'react';
import { submitTicket } from '../../services/support.service';

export default function Support() {
  const [issueType, setIssueType] = useState('API Error');
  const [message, setMessage] = useState('');
  const [includeLogs, setIncludeLogs] = useState(true);
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setTicket(null);

    try {
      const res = await submitTicket({ issueType, message, includeLogs });
      setTicket(res.data);
      setMessage('');
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to submit support ticket. Please try again later.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.heading}>Support & Help Center</h1>
        <p style={styles.subHeading}>Have an issue? Our automated diagnostic system will help us resolve it faster.</p>
      </header>

      <div style={styles.layout}>
        {/* Contact Form */}
        <div style={styles.formCard}>
          <h2 style={styles.cardTitle}>Submit a Ticket</h2>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>What are you having trouble with?</label>
              <select 
                style={styles.select} 
                value={issueType} 
                onChange={(e) => setIssueType(e.target.value)}
              >
                <option>API Error</option>
                <option>Billing & Payments</option>
                <option>API Key Issues</option>
                <option>Usage & Quota Conversion</option>
                <option>Other / Integration Help</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Describe your issue</label>
              <textarea
                style={styles.textarea}
                placeholder="Ex: I'm getting a 429 error even though my quota shows 50% remaining..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>

            <div style={styles.checkboxGroup}>
              <input 
                type="checkbox" 
                id="attach" 
                checked={includeLogs} 
                onChange={(e) => setIncludeLogs(e.target.checked)}
                style={styles.checkbox}
              />
              <label htmlFor="attach" style={styles.checkboxLabel}>
                <strong>Attach Diagnostic Logs</strong>
                <span style={styles.checkboxSub}>Includes your recent API errors and usage metrics to help our team debug faster.</span>
              </label>
            </div>

            {error && <div style={styles.error}>{error}</div>}
            
            <button 
              type="submit" 
              style={loading ? styles.btnDisabled : styles.btn} 
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Support Ticket'}
            </button>
          </form>

          {ticket && (
            <div style={styles.success}>
              <div style={styles.successHead}>✓ Ticket Submitted Successfully</div>
              <p style={styles.successText}>
                Your ticket <strong>#{ticket.ticketId}</strong> has been created. 
                Our support team typically responds within 2-4 hours. 
                {ticket.status === 'simulated' && <span style={styles.demoMode}> (Demo Mode: Email simulated in server console)</span>}
              </p>
            </div>
          )}
        </div>

        {/* Info Sidebar */}
        <div style={styles.infoCol}>
          <div style={styles.infoCard}>
            <h3 style={styles.infoTitle}>Quick Support Links</h3>
            <ul style={styles.infoList}>
              <li style={styles.infoItem}> API Documentation</li>
              <li style={styles.infoItem}> System Status: <span style={styles.statusOk}>Operational</span></li>
              <li style={styles.infoItem}> Community Discord</li>
              <li style={styles.infoItem}> support@api-platform.com</li>
            </ul>
          </div>

          <div style={styles.tipsCard}>
            <h3 style={styles.infoTitle}>Pro Tip</h3>
            <p style={styles.tipsText}>
              Using our <strong>AI Assistant</strong> (bottom right) can often solve 90% of issues instantly by analyzing your live code and usage patterns!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { paddingBottom: '60px' },
  header: { marginBottom: '32px' },
  heading: { fontSize: '28px', fontWeight: '800', color: '#fff', marginBottom: '8px' },
  subHeading: { color: '#9ca3af', fontSize: '15px' },
  layout: { display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' },
  
  formCard: {
    background: '#13131a', borderRadius: '16px', padding: '32px',
    border: '1px solid #1e1e2e', boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
  },
  cardTitle: { fontSize: '20px', fontWeight: '700', color: '#fff', marginBottom: '24px' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '14px', fontWeight: '500', color: '#e5e7eb' },
  select: {
    background: '#1e1e2e', border: '1px solid #2a2a3a', borderRadius: '8px',
    padding: '12px', color: '#fff', fontSize: '14px', outline: 'none'
  },
  textarea: {
    background: '#1e1e2e', border: '1px solid #2a2a3a', borderRadius: '8px',
    padding: '12px', color: '#fff', fontSize: '14px', outline: 'none',
    minHeight: '160px', resize: 'vertical'
  },
  checkboxGroup: { display: 'flex', gap: '12px', background: 'rgba(124, 111, 205, 0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(124, 111, 205, 0.1)' },
  checkbox: { width: '18px', height: '18px', marginTop: '4px', accentColor: '#7c6fcd' },
  checkboxLabel: { display: 'flex', flexDirection: 'column', gap: '2px', cursor: 'pointer', color: '#fff', fontSize: '14px' },
  checkboxSub: { fontSize: '12px', color: '#6b7280' },
  
  btn: {
    background: '#7c6fcd', color: '#fff', border: 'none', borderRadius: '8px',
    padding: '14px', fontSize: '15px', fontWeight: '600', cursor: 'pointer',
    transition: 'all 0.2s ease', marginTop: '10px'
  },
  btnDisabled: {
    background: '#374151', color: '#9ca3af', border: 'none', borderRadius: '8px',
    padding: '14px', fontSize: '15px', fontWeight: '600', cursor: 'not-allowed', marginTop: '10px'
  },

  success: { marginTop: '24px', padding: '20px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '12px' },
  successHead: { color: '#10b981', fontWeight: '700', fontSize: '16px', marginBottom: '8px' },
  successText: { color: '#9ca3af', fontSize: '14px', lineHeight: '1.5' },
  demoMode: { color: '#7c6fcd', fontStyle: 'italic', fontWeight: '500' },
  error: { color: '#ef4444', fontSize: '14px', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px' },

  infoCol: { display: 'flex', flexDirection: 'column', gap: '20px' },
  infoCard: { background: '#13131a', borderRadius: '16px', padding: '24px', border: '1px solid #1e1e2e' },
  infoTitle: { color: '#fff', fontSize: '16px', fontWeight: '700', marginBottom: '16px' },
  infoList: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' },
  infoItem: { color: '#9ca3af', fontSize: '14px', cursor: 'pointer' },
  statusOk: { color: '#10b981', fontWeight: '600' },

  tipsCard: { background: '#13131a', border: '1px solid #7c6fcd33', borderRadius: '16px', padding: '24px', borderLeft: '4px solid #7c6fcd' },
  tipsText: { color: '#9ca3af', fontSize: '13px', lineHeight: '1.6' }
};
