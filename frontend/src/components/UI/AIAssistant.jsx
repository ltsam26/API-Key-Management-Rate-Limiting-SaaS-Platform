import { useState, useEffect, useRef, useCallback } from 'react';
import { sendAIMessage } from '../../services/ai.service';

/* ─── Quick action suggestions ─── */
const QUICK_ACTIONS = [
  { label: '📊 My usage stats',            msg: 'Show me my current usage statistics and quota status.' },
  { label: '🚨 Explain my errors',         msg: 'Analyze my recent errors and tell me what is causing them.' },
  { label: '💳 My plan & billing',         msg: 'What plan am I on? What are my limits and when does it reset?' },
  { label: '⚡ Why am I getting 429?',     msg: 'Why am I getting 429 rate limit errors? How do I fix them?' },
  { label: '🔑 How to use the API?',       msg: 'Show me how to make an API request with my key, with a code example.' },
  { label: '📈 Should I upgrade?',         msg: 'Based on my usage, should I upgrade my plan? What would I get?' },
];

/* ─── Simple markdown-like renderer ─── */
function RenderMessage({ text }) {
  const parts = text.split(/(```[\s\S]*?```|`[^`]+`|\*\*[^*]+\*\*|\n)/g);
  let inCode = false;
  let codeBuffer = '';
  let codeLanguage = '';
  const elements = [];
  let key = 0;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;

    if (part.startsWith('```')) {
      const inner = part.slice(3, -3);
      const lines = inner.split('\n');
      const lang = lines[0].trim();
      const code = lines.slice(1).join('\n').trim();
      elements.push(
        <div key={key++} style={ms.codeBlock}>
          {lang && <div style={ms.codeLang}>{lang}</div>}
          <pre style={ms.codePre}><code>{code || inner.trim()}</code></pre>
        </div>
      );
    } else if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      elements.push(<code key={key++} style={ms.inlineCode}>{part.slice(1, -1)}</code>);
    } else if (part.startsWith('**') && part.endsWith('**')) {
      elements.push(<strong key={key++} style={{ color: '#d1d5db' }}>{part.slice(2, -2)}</strong>);
    } else if (part === '\n') {
      elements.push(<br key={key++} />);
    } else if (part.startsWith('• ') || part.startsWith('* ') || part.startsWith('- ')) {
      elements.push(<div key={key++} style={ms.bullet}><span style={{ color: '#7c6fcd' }}>▸</span> {part.slice(2)}</div>);
    } else {
      elements.push(<span key={key++}>{part}</span>);
    }
  }
  return <div style={ms.msgText}>{elements}</div>;
}

export default function AIAssistant() {
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      parts: "👋 Hi! I'm your AI Assistant. I have access to your real-time API usage, quota, errors, and billing data.\n\nAsk me anything about your platform — or pick a quick action below.",
      ts: new Date(),
    },
  ]);
  const [input,   setInput]    = useState('');
  const [loading, setLoading]  = useState(false);
  const [pulse,   setPulse]    = useState(false);
  const [snapshot, setSnapshot] = useState(null);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const abortRef   = useRef(null);

  /* Auto-scroll on new message */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* Focus input when opened */
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  /* Pulse new message indicator when closed */
  const triggerPulse = useCallback(() => {
    if (!open) { setPulse(true); setTimeout(() => setPulse(false), 3000); }
  }, [open]);

  const buildHistory = (msgs) =>
    msgs.slice(1).map(m => ({ role: m.role, parts: m.parts }));

  const sendMessage = async (text) => {
    const userMsg = text.trim();
    if (!userMsg || loading) return;

    setInput('');
    const userEntry = { role: 'user', parts: userMsg, ts: new Date() };
    setMessages(prev => [...prev, userEntry]);
    setLoading(true);

    try {
      const currentMsgs = [...messages, userEntry];
      const res = await sendAIMessage(userMsg, buildHistory(currentMsgs));
      const { reply, snapshot: snap } = res.data;
      if (snap) setSnapshot(snap);
      setMessages(prev => [...prev, { role: 'assistant', parts: reply, ts: new Date() }]);
      triggerPulse();
    } catch (err) {
      const errText = err.response?.data?.reply ||
        err.response?.data?.error ||
        "⚠️ Connection error. Make sure the backend is running and your GEMINI_API_KEY is set.";
      setMessages(prev => [...prev, { role: 'assistant', parts: errText, ts: new Date(), isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      parts: "Chat cleared. How can I help you?",
      ts: new Date(),
    }]);
    setSnapshot(null);
  };

  /* ─── Status bar colors ─── */
  const quotaColor = snapshot
    ? snapshot.percentUsed > 90 ? '#ef4444'
      : snapshot.percentUsed > 70 ? '#f59e0b'
      : '#10b981'
    : '#10b981';

  return (
    <>
      {/* ── Floating Action Button ── */}
      <button
        id="ai-assistant-fab"
        onClick={() => { setOpen(o => !o); setPulse(false); }}
        style={{
          ...fab,
          background: open ? '#1e1e2e' : 'linear-gradient(135deg, #7c6fcd, #9b59b6)',
          boxShadow: open
            ? '0 4px 20px rgba(0,0,0,0.4)'
            : '0 4px 20px rgba(124,111,205,0.5)',
        }}
        title="AI Assistant"
      >
        {open ? '✕' : '✦'}
        {pulse && !open && <span style={fabPulse} />}
      </button>

      {/* ── Chat Panel ── */}
      {open && (
        <div style={panel}>

          {/* Header */}
          <div style={panelHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={aiAvatar}>✦</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: '#fff' }}>AI Assistant</div>
                <div style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  Context-aware · Real-time data
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button style={iconBtn} onClick={clearChat} title="Clear chat">🗑</button>
              <button style={iconBtn} onClick={() => setOpen(false)} title="Close">✕</button>
            </div>
          </div>

          {/* Snapshot bar */}
          {snapshot && (
            <div style={snapshotBar}>
              <SnapChip label="Plan" value={snapshot.plan} color="#7c6fcd" />
              <SnapChip label="Today" value={`${snapshot.todayRequests}/${snapshot.dailyQuota}`} color={quotaColor} />
              <SnapChip label="Left" value={snapshot.remaining.toLocaleString()} color={quotaColor} />
              <SnapChip label="Errors" value={snapshot.errorCount} color={snapshot.errorCount > 0 ? '#ef4444' : '#10b981'} />
            </div>
          )}

          {/* Messages */}
          <div style={msgArea}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start', gap: '4px' }}>
                {/* Role label */}
                <div style={{ fontSize: '10px', color: '#374151', padding: '0 6px' }}>
                  {m.role === 'user' ? 'You' : '✦ AI'}
                  {' · '}{new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div style={{
                  ...bubble,
                  ...(m.role === 'user' ? userBubble : aiBubble),
                  ...(m.isError ? errBubble : {}),
                  maxWidth: m.role === 'user' ? '80%' : '92%',
                }}>
                  {m.role === 'assistant' ? <RenderMessage text={m.parts} /> : <span style={{ fontSize: '13px' }}>{m.parts}</span>}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', flexDirection: 'column' }}>
                <div style={{ fontSize: '10px', color: '#374151', padding: '0 6px' }}>✦ AI · thinking…</div>
                <div style={{ ...bubble, ...aiBubble }}>
                  <div style={typingDots}>
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick actions (only when 1 message) */}
          {messages.length <= 1 && !loading && (
            <div style={quickSection}>
              <div style={{ fontSize: '10px', color: '#374151', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Quick Actions</div>
              <div style={quickGrid}>
                {QUICK_ACTIONS.map((qa, i) => (
                  <button key={i} style={quickBtn} onClick={() => sendMessage(qa.msg)}>
                    {qa.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input area */}
          <div style={inputArea}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about usage, errors, billing, API integration…"
              style={inputBox}
              rows={1}
              disabled={loading}
            />
            <button
              id="ai-send-btn"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              style={{
                ...sendBtn,
                opacity: (!input.trim() || loading) ? 0.4 : 1,
                cursor: (!input.trim() || loading) ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? <span style={miniSpinner} /> : '↑'}
            </button>
          </div>
          <div style={{ fontSize: '10px', color: '#1f2937', textAlign: 'center', paddingBottom: '8px' }}>
            Powered by Gemini · Using your live account data
          </div>
        </div>
      )}

      {/* Keyframe styles */}
      <style>{`
        @keyframes slideUp   { from { opacity:0; transform:translateY(16px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes fadeIn    { from { opacity:0; } to { opacity:1; } }
        @keyframes blink     { 0%,80%,100% { opacity:0.2; transform:scale(0.8); } 40% { opacity:1; transform:scale(1.1); } }
        @keyframes pulseRing { 0% { transform:scale(1); opacity:0.8; } 100% { transform:scale(2.2); opacity:0; } }
        @keyframes spin      { to { transform:rotate(360deg); } }
        .ai-quick-btn:hover { background:#1e1e3a !important; border-color:#7c6fcd55 !important; color:#a89de0 !important; }
        .ai-input:focus { border-color:#7c6fcd88 !important; outline:none; }
      `}</style>
    </>
  );
}

function SnapChip({ label, value, color }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'1px', background:'#13131a', borderRadius:'8px', padding:'5px 10px', border:`1px solid ${color}22` }}>
      <span style={{ fontSize:'9px', color:'#4b5563', textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</span>
      <span style={{ fontSize:'12px', fontWeight:700, color }}>{value}</span>
    </div>
  );
}

/* ─── Styles ─── */
const fab = {
  position:'fixed', bottom:'30px', right:'30px',
  width:'56px', height:'56px', borderRadius:'50%',
  border:'none', color:'#fff', fontSize:'22px',
  display:'flex', alignItems:'center', justifyContent:'center',
  cursor:'pointer', zIndex:1000, transition:'all 0.25s ease',
  fontWeight:700, position:'fixed',
};
const fabPulse = {
  position:'absolute', width:'56px', height:'56px', borderRadius:'50%',
  border:'2px solid #7c6fcd', animation:'pulseRing 1.4s ease-out infinite',
  top:0, left:0,
};
const panel = {
  position:'fixed', bottom:'96px', right:'30px',
  width:'420px', maxHeight:'600px',
  background:'#0d0d14', border:'1px solid #1e1e2e',
  borderRadius:'20px', boxShadow:'0 24px 80px rgba(0,0,0,0.7)',
  display:'flex', flexDirection:'column', zIndex:999,
  animation:'slideUp 0.25s ease',
  fontFamily:"'Inter','Segoe UI',sans-serif",
  overflow:'hidden',
};
const panelHeader = {
  display:'flex', justifyContent:'space-between', alignItems:'center',
  padding:'16px 18px 12px',
  borderBottom:'1px solid #1e1e2e',
  background:'linear-gradient(135deg, #13131a, #0d0d14)',
};
const aiAvatar = {
  width:'34px', height:'34px', borderRadius:'50%',
  background:'linear-gradient(135deg,#7c6fcd,#9b59b6)',
  display:'flex', alignItems:'center', justifyContent:'center',
  fontSize:'16px', color:'#fff', fontWeight:800,
  boxShadow:'0 0 12px rgba(124,111,205,0.4)',
};
const iconBtn = {
  background:'transparent', border:'none', color:'#4b5563',
  cursor:'pointer', fontSize:'14px', padding:'4px 7px',
  borderRadius:'6px', transition:'all 0.15s',
};
const snapshotBar = {
  display:'flex', gap:'8px', padding:'10px 14px',
  borderBottom:'1px solid #111118', overflowX:'auto',
  background:'#0a0a10',
};
const msgArea = {
  flex:1, overflowY:'auto', padding:'16px 14px',
  display:'flex', flexDirection:'column', gap:'14px',
  scrollbarWidth:'thin', scrollbarColor:'#1e1e2e transparent',
};
const bubble = {
  borderRadius:'14px', padding:'10px 14px',
  fontSize:'13px', lineHeight:1.6, wordBreak:'break-word',
};
const aiBubble  = { background:'#13131a', border:'1px solid #1e1e2e', color:'#d1d5db', borderBottomLeftRadius:'4px' };
const userBubble = { background:'linear-gradient(135deg,#3730a3,#7c6fcd)', color:'#fff', borderBottomRightRadius:'4px' };
const errBubble  = { background:'#2d1515', border:'1px solid #5c2626', color:'#f87171' };
const typingDots = {
  display:'flex', gap:'4px', alignItems:'center', padding:'2px 0',
};
const quickSection = {
  padding:'10px 14px', borderTop:'1px solid #111118',
};
const quickGrid = {
  display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px',
};
const quickBtn = {
  background:'#13131a', border:'1px solid #1e1e2e',
  color:'#6b7280', borderRadius:'8px', padding:'7px 10px',
  fontSize:'11px', cursor:'pointer', textAlign:'left',
  transition:'all 0.15s', lineHeight:1.3,
};
const inputArea = {
  display:'flex', gap:'8px', padding:'10px 14px 4px',
  borderTop:'1px solid #1e1e2e', alignItems:'flex-end',
};
const inputBox = {
  flex:1, background:'#13131a', border:'1px solid #2a2a3a',
  borderRadius:'12px', color:'#fff', fontSize:'13px',
  padding:'10px 14px', resize:'none', outline:'none',
  fontFamily:'inherit', lineHeight:1.5, maxHeight:'120px',
  transition:'border-color 0.2s',
};
const sendBtn = {
  width:'38px', height:'38px', borderRadius:'50%', border:'none',
  background:'#7c6fcd', color:'#fff', fontSize:'18px',
  display:'flex', alignItems:'center', justifyContent:'center',
  transition:'all 0.2s', flexShrink:0, fontWeight:700,
};
const miniSpinner = {
  width:'14px', height:'14px', border:'2px solid rgba(255,255,255,0.3)',
  borderTop:'2px solid #fff', borderRadius:'50%',
  animation:'spin 0.7s linear infinite', display:'inline-block',
};

/* ─── Markdown sub-styles ─── */
const ms = {
  msgText:    { display:'flex', flexDirection:'column', gap:'4px' },
  codeBlock:  { background:'#0a0a0f', borderRadius:'8px', overflow:'hidden', margin:'6px 0', border:'1px solid #1e1e2e' },
  codeLang:   { background:'#1e1e2e', color:'#6b7280', fontSize:'10px', padding:'4px 12px', fontWeight:600, letterSpacing:'0.05em' },
  codePre:    { margin:0, padding:'12px', color:'#a3e635', fontSize:'11px', fontFamily:'monospace', overflowX:'auto', lineHeight:1.6, whiteSpace:'pre-wrap' },
  inlineCode: { background:'#1e1e2e', color:'#a3e635', padding:'1px 6px', borderRadius:'4px', fontSize:'12px', fontFamily:'monospace' },
  bullet:     { display:'flex', gap:'8px', alignItems:'flex-start', padding:'1px 0', color:'#9ca3af', fontSize:'13px' },
};
