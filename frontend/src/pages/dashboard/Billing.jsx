import { useEffect, useState, useCallback } from 'react';
import {
  getBillingOverview,
  getUsageAnalytics,
  getBillingApiKeys,
  getInvoices,
  createRazorpayOrder,
  verifyRazorpayPayment,
  upgradePlan,
} from '../../services/payment.service';
import { useAuth } from '../../hooks/useAuth';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';

/* ─── Plan config (mirrors backend PLANS) ─── */
const PLANS = {
  FREE:       { price: '$0',   priceINR: '₹0',    period: '/month', color: '#af6bebff', accent: '#9ca3af', glow: 'rgba(107,114,128,0.08)', tag: 'Free Forever',   features: ['10 req/min rate limit', '100 req/day quota', 'Up to 2 API keys', 'Basic analytics', 'Community support'] },
  BASIC:      { price: '$2',   priceINR: '₹99',  period: '/month', color: '#3b82f6', accent: '#60a5fa', glow: 'rgba(59,130,246,0.08)',  tag: 'Most Popular',    features: ['30 req/min rate limit', '1,000 req/day quota', 'Up to 5 API keys', 'Full analytics', 'Email support'] },
  PRO:        { price: '$29',  priceINR: '₹299',period: '/month', color: '#7c6fcd', accent: '#a89de0', glow: 'rgba(124,111,205,0.08)', tag: 'Best Value',      features: ['100 req/min rate limit', '10,000 req/day quota', 'Up to 20 API keys', 'Advanced analytics', 'Priority support'] },
  ENTERPRISE: { price: '$99',  priceINR: '₹499',period: '/month', color: '#f59e0b', accent: '#fbbf24', glow: 'rgba(245,158,11,0.08)',  tag: 'Unlimited Scale', features: ['1,000 req/min rate limit', '100,000 req/day quota', 'Up to 100 API keys', 'Custom analytics', '24/7 dedicated support'] },
};

const planBadge = {
  FREE:       { background: '#1a1a2e', color: '#6261b8ff', border: '1px solid rgba(124,111,205,0.3)' },
  BASIC:      { background: '#1a1f3a', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)' },
  PRO:        { background: '#14532d', color: '#4ade80', border: '1px solid rgba(20,83,45,0.8)' },
  ENTERPRISE: { background: '#2d1f00', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' },
};

/* ─── Load Razorpay checkout script lazily ─── */
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function Billing() {
  const { user } = useAuth();
  const [overview,  setOverview]  = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [apiKeys,   setApiKeys]   = useState([]);
  const [invoices,  setInvoices]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [upgrading, setUpgrading] = useState('');
  const [msg,       setMsg]       = useState({ type: '', text: '' });
  const [copied,    setCopied]    = useState('');

  /* ─── Load all data in parallel ─── */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ovRes, anRes, keyRes, invRes] = await Promise.allSettled([
        getBillingOverview(),
        getUsageAnalytics(),
        getBillingApiKeys(),
        getInvoices(),
      ]);
      if (ovRes.status  === 'fulfilled') setOverview(ovRes.value.data);
      if (anRes.status  === 'fulfilled') setAnalytics(anRes.value.data);
      if (keyRes.status === 'fulfilled') setApiKeys(keyRes.value.data.keys  || []);
      if (invRes.status === 'fulfilled') setInvoices(invRes.value.data.invoices || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ─── Simulated payment handler (No Razorpay for testing) ─── */
  const handlePlanSelect = async (plan) => {
    setMsg({ type: '', text: '' });
    setUpgrading(plan);

    try {
      const res = await upgradePlan(plan);
      setMsg({ type: 'success', text: res.data.message || `Switched to ${plan} plan.` });
      
      // Auto-reload data after successful upgrade
      setTimeout(load, 1200);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || err.response?.data?.error || 'Simulated upgrade failed.' });
    } finally {
      setUpgrading('');
    }
  };

  const copyKeyId = (id) => {
    try { navigator.clipboard.writeText(id); } catch (_) {}
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  const currentPlan = overview?.plan || 'FREE';
  const planInfo    = PLANS[currentPlan] || PLANS.FREE;
  const usage       = overview?.usage || {};

  const chartData = (analytics?.dailyRequests || []).map(d => ({
    date:     new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    requests: parseInt(d.requests) || 0,
    errors:   parseInt(d.errors)   || 0,
  }));
  const tokenData = (analytics?.tokensByProject || []).map(d => ({
    name:   (d.project || 'Unknown').slice(0, 14),
    tokens: parseInt(d.tokens) || 0,
  }));

  /* ─────────────────────────── RENDER ─────────────────────────── */
  return (
    <div style={s.page}>

      {/* ── Page Header ── */}
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.heading}>Subscriptions</h1>
          <p style={s.sub}>Manage your plan and usage inside this <strong>Restricted Simulation Mode</strong></p>
        </div>
        {!loading && (
          <div style={{ ...s.planBadge, background: planInfo.glow, border: `1px solid ${planInfo.color}55`, color: planInfo.accent }}>
            <span>⚡</span> {currentPlan} Plan
          </div>
        )}
      </div>

      {/* ── Notification ── */}
      {msg.text && (
        <div style={msg.type === 'success' ? s.notifSuccess : s.notifError}>
          {msg.type === 'success' ? '✅' : '❌'} {msg.text}
          <button style={s.dimissBtn} onClick={() => setMsg({ type: '', text: '' })}>✕</button>
        </div>
      )}

      {loading ? (
        <div style={s.loadWrap}>
          <div style={s.spinner} />
          <p style={{ color: '#4b5563', margin: 0 }}>Loading billing data…</p>
        </div>
      ) : (
        <>

          {/* ══════════════════════════════════════════
              SECTION 1 — CURRENT PLAN
          ══════════════════════════════════════════ */}
          <Section title="📋 Current Plan">

            <div style={s.planRow}>
              {/* Plan card */}
              <div style={{ ...s.planInfoCard, borderColor: planInfo.color + '55', background: planInfo.glow }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: planInfo.color, boxShadow: `0 0 8px ${planInfo.color}` }} />
                  <span style={{ fontSize: '22px', fontWeight: 800, color: planInfo.accent }}>{currentPlan}</span>
                  <span style={{ fontSize: '11px', fontWeight: 600, borderRadius: '20px', padding: '2px 10px', background: planInfo.color + '22', color: planInfo.accent }}>
                    {planInfo.tag}
                  </span>
                </div>
                <div style={{ fontSize: '34px', fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                  {planInfo.priceINR}
                  <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: 400 }}>/month</span>
                </div>
                {overview?.subscribedAt && (
                  <p style={{ color: '#4b5563', fontSize: '12px', margin: '12px 0 0', lineHeight: 1.5 }}>
                    Active since {new Date(overview.subscribedAt).toLocaleDateString()}
                    {overview.expiresAt && (
                      <><br />Renews on {new Date(overview.expiresAt).toLocaleDateString()}</>
                    )}
                  </p>
                )}
              </div>

              {/* Stats table */}
              <div style={s.statsTable}>
                <StatRow label="Plan"         value={currentPlan}                                         hi={planInfo.accent} />
                <StatRow label="Usage (30d)"  value={`${(usage.requests || 0).toLocaleString()} requests`} />
                <StatRow label="Daily Quota"  value={`${(usage.dailyQuota || 0).toLocaleString()} req/day`} />
                <StatRow label="Today Used"   value={`${(usage.todayRequests || 0).toLocaleString()} req`} />
                <StatRow label="Remaining"    value={`${(usage.remaining || 0).toLocaleString()} req`}    hi={usage.percentUsed > 80 ? '#ef4444' : '#10b981'} />
                <StatRow label="Quota Reset"  value={usage.nextReset ? new Date(usage.nextReset).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' UTC' : '—'} />
                <StatRow label="Est. Cost"    value={`$${overview?.estimatedCost || '0.00'}`}             hi="#ec4899" />
              </div>

              {/* SVG gauge */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <p style={{ color: '#4b5563', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Daily Quota</p>
                <svg viewBox="0 0 120 120" width="140" height="140">
                  <circle cx="60" cy="60" r="48" fill="none" stroke="#1e1e2e" strokeWidth="10" />
                  <circle
                    cx="60" cy="60" r="48" fill="none"
                    stroke={usage.percentUsed > 80 ? '#ef4444' : usage.percentUsed > 50 ? '#f59e0b' : '#10b981'}
                    strokeWidth="10"
                    strokeDasharray={`${(2 * Math.PI * 48 * (usage.percentUsed || 0)) / 100} 999`}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                    style={{ transition: 'stroke-dasharray 0.6s ease' }}
                  />
                  <text x="60" y="57" textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="20" fontWeight="800">
                    {usage.percentUsed || 0}%
                  </text>
                  <text x="60" y="75" textAnchor="middle" fill="#4b5563" fontSize="9">used today</text>
                </svg>
              </div>
            </div>
          </Section>

          {/* ══════════════════════════════════════════
              SECTION 2 — USAGE ANALYTICS
          ══════════════════════════════════════════ */}
          <Section title="📈 Usage Analytics">
            <div style={s.twoCol}>
              <div style={s.chartBox}>
                <p style={s.chartTitle}>Requests Over Time — 14 days</p>
                {chartData.length === 0 ? <NoData /> : (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#7c6fcd" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#7c6fcd" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="errGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#1e1e2e" strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={s.tooltip} />
                      <Area type="monotone" dataKey="requests" stroke="#7c6fcd" strokeWidth={2} fill="url(#reqGrad)" name="Requests" />
                      <Area type="monotone" dataKey="errors"   stroke="#ef4444" strokeWidth={1.5} fill="url(#errGrad)" name="Errors" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div style={s.chartBox}>
                <p style={s.chartTitle}>Tokens / Requests by Project</p>
                {tokenData.length === 0 ? <NoData /> : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={tokenData} layout="vertical">
                      <CartesianGrid stroke="#1e1e2e" strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis dataKey="name" type="category" width={90} tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={s.tooltip} cursor={{ fill: '#1e1e2e' }} />
                      <Bar dataKey="tokens" fill="#7c6fcd" radius={[0, 4, 4, 0]} name="Requests" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </Section>

          {/* ══════════════════════════════════════════
              SECTION 3 — PRICING PLANS (Razorpay)
          ══════════════════════════════════════════ */}
          <Section title="💎 Pricing Plans">

            {/* Razorpay badge */}
            <div style={{ ...s.rzpBadgeRow, borderColor: '#7c6fcd55', background: '#7c6fcd0a' }}>
              <span style={{ fontSize: '16px' }}>🧪</span>
              <span style={{ color: '#a89de0', fontSize: '12px', fontWeight: 500 }}>
                <strong>Simulation Mode Active</strong> · No real payment required · Click any plan to instantly upgrade and test features
              </span>
            </div>

            <div style={s.planGrid}>
              {Object.entries(PLANS).map(([key, p]) => {
                const isCurrent = key === currentPlan;
                const isLoading = upgrading === key;
                return (
                  <div
                    key={key}
                    style={{
                      ...s.planCard,
                      border:     isCurrent ? `2px solid ${p.color}` : `1px solid ${p.color}33`,
                      background: isCurrent ? p.glow : '#13131a',
                      boxShadow:  isCurrent ? `0 0 28px 0 ${p.color}22` : 'none',
                    }}
                  >
                    {isCurrent && (
                      <div style={{ ...s.planTagBar, background: p.color }}>✓ Current Plan</div>
                    )}
                    {!isCurrent && (
                      <div style={{ ...s.planTagBar, background: p.color + '22', color: p.accent }}>{p.tag}</div>
                    )}

                    <h3 style={{ color: p.accent, fontSize: '18px', fontWeight: 800, margin: '16px 0 4px' }}>{key}</h3>

                    {/* Price — show INR */}
                    <div style={{ marginBottom: '4px' }}>
                      <span style={{ fontSize: '32px', fontWeight: 900, color: '#fff' }}>{p.priceINR}</span>
                      <span style={{ fontSize: '13px', color: '#6b7280' }}>{p.period}</span>
                    </div>
                    <div style={{ color: '#4b5563', fontSize: '11px', marginBottom: '16px' }}>{p.price} USD</div>

                    <ul style={s.featureList}>
                      {p.features.map(f => (
                        <li key={f} style={s.featureItem}>
                          <span style={{ color: p.color, fontWeight: 700 }}>✓</span> {f}
                        </li>
                      ))}
                    </ul>

                    <button
                      id={`btn-plan-${key}`}
                      onClick={() => !isCurrent && !upgrading && handlePlanSelect(key)}
                      disabled={isCurrent || !!upgrading}
                      style={{
                        ...s.planBtn,
                        marginTop:  '16px',
                        background: isCurrent ? p.color + '33' : p.color,
                        color:      isCurrent ? p.accent : '#fff',
                        cursor:     isCurrent || upgrading ? 'not-allowed' : 'pointer',
                        opacity:    upgrading && upgrading !== key ? 0.5 : 1,
                      }}
                    >
                      {isLoading ? (
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <span style={s.btnSpinner} /> Upgrading...
                        </span>
                      ) : isCurrent ? '✓ Active Plan' : `Activate ${key} (Test)`}
                    </button>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* ══════════════════════════════════════════
              SECTION 4 — API KEYS
          ══════════════════════════════════════════ */}
          <Section title="🔑 API Keys">
            {apiKeys.length === 0 ? (
              <div style={s.empty}>
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>⚿</div>
                <p style={{ color: '#4b5563', margin: 0 }}>No API keys found. Generate keys from the API Keys page.</p>
              </div>
            ) : (
              <div style={s.tableWrap}>
                <div style={{ ...s.tableRow, ...s.tableHead }}>
                  <span>Key ID</span>
                  <span>Project</span>
                  <span>Plan</span>
                  <span>Created</span>
                  <span>Last Used</span>
                  <span>Total Req</span>
                  <span>Status</span>
                </div>
                {apiKeys.map((k) => (
                  <div key={k.id} style={s.tableRow}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={s.mono}>{k.id.slice(0, 14)}…</span>
                      <button style={s.copyMini} onClick={() => copyKeyId(k.id)} title="Copy Key ID">
                        {copied === k.id ? '✓' : '⎘'}
                      </button>
                    </span>
                    <span style={{ color: '#d1d5db', fontSize: '13px' }}>{k.project_name}</span>
                    <span>
                      <span style={{ ...s.badge, ...(planBadge[(k.plan || 'FREE').toUpperCase()] || planBadge.FREE) }}>
                        {(k.plan || 'FREE').toUpperCase()}
                      </span>
                    </span>
                    <span style={s.dateCell}>{new Date(k.created_at).toLocaleDateString()}</span>
                    <span style={s.dateCell}>{k.last_used ? new Date(k.last_used).toLocaleDateString() : '—'}</span>
                    <span style={{ color: '#9ca3af', fontSize: '13px' }}>{parseInt(k.total_requests || 0).toLocaleString()}</span>
                    <span>
                      <span style={k.is_active ? s.activeTag : s.revokedTag}>
                        {k.is_active ? 'Active' : 'Revoked'}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* ══════════════════════════════════════════
              SECTION 5 — BILLING (Invoices + Payment)
          ══════════════════════════════════════════ */}
          <Section title="💳 Billing">
            <div style={s.twoCol}>

              {/* Payment Method — Razorpay info */}
              <div style={s.billingCard}>
                <div style={s.billingCardHeader}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#d1d5db' }}>🧪 Testing Status</span>
                </div>

                <div style={s.rzpPayCard}>
                  <div style={s.rzpLogoRow}>
                    <div style={s.rzpLogo}>
                      <span style={{ fontSize: '20px' }}>⚡</span>
                      <span style={{ color: '#7c6fcd', fontWeight: 800, fontSize: '16px' }}>Simulation Active</span>
                    </div>
                  </div>

                  <p style={{ color: '#4b5563', fontSize: '12px', margin: '0', lineHeight: 1.6 }}>
                    You are currently in the <strong>Internal Testing Period</strong>. All payment gateways are bypassed.
                    Upgrading your plan will instantly update your rate limits and quotas in the database for validation.
                  </p>
                </div>
              </div>

              {/* Invoice history */}
              <div style={s.billingCard}>
                <div style={s.billingCardHeader}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#d1d5db' }}>🧾 Invoice History</span>
                </div>
                {invoices.length === 0 ? (
                  <div style={s.empty}>
                    <p style={{ color: '#4b5563', fontSize: '13px', margin: 0 }}>No invoices yet. Upgrade to a paid plan to see them here.</p>
                  </div>
                ) : (
                  <div>
                    <div style={{ ...s.invRow, color: '#4b5563', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #1e1e2e', paddingBottom: '8px', marginBottom: '2px' }}>
                      <span>Invoice</span><span>Plan</span><span>Amount</span><span>Date</span><span>Status</span>
                    </div>
                    {invoices.slice(0, 8).map((inv, i) => (
                      <div key={i} style={s.invRow}>
                        <span style={s.mono}>{inv.invoice_id || `INV-${1000 + i}`}</span>
                        <span style={{ color: '#9ca3af', fontSize: '12px' }}>{inv.plan}</span>
                        <span style={{ color: '#d1d5db', fontSize: '13px', fontWeight: 600 }}>
                          ₹{((inv.amount || 0) * (Number.isInteger(inv.amount) && inv.amount > 500 ? 1 : 83)).toFixed(0)}
                        </span>
                        <span style={s.dateCell}>{new Date(inv.issued_at).toLocaleDateString()}</span>
                        <span>
                          <span style={{ ...s.badge, background: '#0f1f15', color: '#4ade80', border: '1px solid #14532d' }}>paid</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </Section>

        </>
      )}
    </div>
  );
}

/* ─── Sub-components ─── */
function Section({ title, children }) {
  return (
    <div style={s.section}>
      <div style={s.sectionHeader}>
        <span style={s.sectionTitle}>{title}</span>
        <div style={s.sectionLine} />
      </div>
      {children}
    </div>
  );
}

function StatRow({ label, value, hi }) {
  return (
    <div style={s.statRow}>
      <span style={s.statLabel}>{label}</span>
      <span style={{ ...s.statValue, color: hi || '#d1d5db' }}>{value}</span>
    </div>
  );
}

function InfoChip({ icon, label }) {
  return (
    <div style={s.infoChip}>
      <span>{icon}</span>
      <span style={{ color: '#6b7280', fontSize: '12px' }}>{label}</span>
    </div>
  );
}

function NoData() {
  return (
    <div style={{ color: '#374151', fontSize: '13px', textAlign: 'center', padding: '40px 0' }}>
      No data yet — make some API requests to see analytics.
    </div>
  );
}

/* ─── Styles ─── */
const s = {
  page:       { fontFamily: "'Inter','Segoe UI',sans-serif", color: '#fff', paddingBottom: '40px' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' },
  heading:    { fontSize: '26px', fontWeight: 800, color: '#fff', margin: '0 0 6px' },
  sub:        { color: '#6b7280', fontSize: '14px', margin: 0 },
  planBadge:  { padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' },

  notifSuccess: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0f1f15', border: '1px solid #14532d', color: '#4ade80', borderRadius: '10px', padding: '12px 18px', marginBottom: '20px', fontSize: '14px', gap: '8px' },
  notifError:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#2d1515', border: '1px solid #5c2626', color: '#f87171', borderRadius: '10px', padding: '12px 18px', marginBottom: '20px', fontSize: '14px', gap: '8px' },
  dimissBtn:    { background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '16px', padding: '0 4px', opacity: 0.7 },

  loadWrap: { display: 'flex', alignItems: 'center', gap: '12px', padding: '60px 0', justifyContent: 'center' },
  spinner:  { width: '22px', height: '22px', border: '2px solid #1e1e2e', borderTop: '2px solid #7c6fcd', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  btnSpinner: { width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' },

  section:       { marginBottom: '36px' },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' },
  sectionTitle:  { color: '#d1d5db', fontSize: '15px', fontWeight: 700, whiteSpace: 'nowrap' },
  sectionLine:   { flex: 1, height: '1px', background: '#1e1e2e' },

  planRow:     { display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' },
  planInfoCard: { flex: 1, minWidth: '200px', border: '1px solid', borderRadius: '14px', padding: '24px 22px' },

  statsTable: { flex: 1, minWidth: '220px', background: '#13131a', border: '1px solid #1e1e2e', borderRadius: '14px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '2px' },
  statRow:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #111118' },
  statLabel:  { color: '#4b5563', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  statValue:  { fontSize: '13px', fontWeight: 600 },

  twoCol:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' },
  chartBox:  { background: '#13131a', border: '1px solid #1e1e2e', borderRadius: '12px', padding: '20px' },
  chartTitle: { color: '#6b7280', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' },
  tooltip:    { background: '#13131a', border: '1px solid #2a2a3a', borderRadius: '8px', color: '#fff' },

  rzpBadgeRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', background: '#0d0d14', border: '1px solid #1e1e2e', borderRadius: '8px', padding: '10px 14px' },

  planGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' },
  planCard: { borderRadius: '16px', padding: '0 20px 22px', position: 'relative', display: 'flex', flexDirection: 'column', transition: 'transform 0.15s ease' },
  planTagBar: { borderRadius: '16px 16px 0 0', padding: '6px 12px', fontSize: '11px', fontWeight: 700, color: '#fff', textAlign: 'center', marginLeft: '-20px', marginRight: '-20px', letterSpacing: '0.02em' },
  featureList: { listStyle: 'none', margin: '0', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 },
  featureItem:  { color: '#9ca3af', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' },
  planBtn: { width: '100%', padding: '12px', borderRadius: '10px', border: 'none', fontSize: '13px', fontWeight: 700, transition: 'opacity 0.2s, transform 0.1s' },

  tableWrap: { background: '#13131a', border: '1px solid #1e1e2e', borderRadius: '12px', overflow: 'hidden' },
  tableHead: { background: '#0d0d14', color: '#4b5563', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' },
  tableRow:  { display: 'grid', gridTemplateColumns: '2fr 1.5fr 0.8fr 1fr 1fr 0.8fr 0.8fr', padding: '11px 16px', borderTop: '1px solid #111118', alignItems: 'center', gap: '8px' },
  mono:     { color: '#6b7280', fontSize: '11px', fontFamily: 'monospace' },
  dateCell:  { color: '#6b7280', fontSize: '12px' },
  badge:     { borderRadius: '5px', padding: '2px 9px', fontSize: '11px', fontWeight: 600, display: 'inline-block' },
  activeTag:  { background: '#14532d', color: '#4ade80', borderRadius: '20px', padding: '2px 10px', fontSize: '11px', fontWeight: 600 },
  revokedTag: { background: '#2d1515', color: '#f87171', borderRadius: '20px', padding: '2px 10px', fontSize: '11px', fontWeight: 600 },
  copyMini:  { background: '#1e1e2e', border: '1px solid #2a2a3a', color: '#9ca3af', borderRadius: '4px', padding: '1px 6px', fontSize: '11px', cursor: 'pointer' },
  empty:     { textAlign: 'center', padding: '40px 20px' },

  billingCard:       { background: '#13131a', border: '1px solid #1e1e2e', borderRadius: '14px', padding: '22px' },
  billingCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' },

  rzpPayCard:  { background: '#0d0d14', border: '1px solid #1e1e3a', borderRadius: '12px', padding: '18px' },
  rzpLogoRow:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' },
  rzpLogo:     { display: 'flex', alignItems: 'center', gap: '8px' },
  rzpInfoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' },
  infoChip:    { display: 'flex', alignItems: 'center', gap: '6px', background: '#13131a', border: '1px solid #1e1e2e', borderRadius: '8px', padding: '6px 10px' },

  invRow: { display: 'grid', gridTemplateColumns: '1.5fr 0.7fr 0.8fr 1fr 0.6fr', padding: '9px 4px', borderBottom: '1px solid #111118', alignItems: 'center', gap: '8px' },
};
