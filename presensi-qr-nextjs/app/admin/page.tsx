'use client';
import { useEffect, useState } from 'react';

function percent(n: number) { return (n * 100).toFixed(1) + '%'; }

export default function AdminPage() {
  const [eventId, setEventId] = useState<string>(process.env.NEXT_PUBLIC_EVENT_ID || 'EVENT_DEMO_123');
  const [adminKey, setAdminKey] = useState<string>(() => (typeof window !== 'undefined' ? localStorage.getItem('ADMIN_KEY') || '' : ''));
  const [tmpKey, setTmpKey] = useState<string>(adminKey);
  const [stats, setStats] = useState<any>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const authed = !!adminKey;

  useEffect(() => {
    if (!authed) return;
    const load = async () => {
      setLoading(true);
      try {
        const s = await fetch(`/api/admin/stats?event_id=${encodeURIComponent(eventId)}`, {
          headers: { 'x-admin-key': adminKey }
        }).then(r => r.json());
        if (s.ok) setStats(s); else setStats(null);

        const r = await fetch(`/api/admin/checkins?event_id=${encodeURIComponent(eventId)}&q=${encodeURIComponent(q)}`, {
          headers: { 'x-admin-key': adminKey }
        }).then(r => r.json());
        if (r.ok) setRows(r.rows || []); else setRows([]);
      } finally { setLoading(false); }
    };
    load();
  }, [authed, adminKey, eventId, q]);

  function login(e: React.FormEvent) {
    e.preventDefault();
    setAdminKey(tmpKey);
    if (typeof window !== 'undefined') localStorage.setItem('ADMIN_KEY', tmpKey);
  }

  function logout() {
    if (typeof window !== 'undefined') localStorage.removeItem('ADMIN_KEY');
    setAdminKey('');
    setTmpKey('');
  }

  return (
    <main style={{ maxWidth: 1000, margin: '40px auto', padding: 16, fontFamily: 'system-ui,Segoe UI,Arial' }}>
      <h1 style={{ marginBottom: 12 }}>Dashboard Panitia</h1>

      {!authed ? (
        <form onSubmit={login} style={{display:'grid', gap:12, maxWidth:420}}>
          <label>
            <div>Masukkan Admin Key</div>
            <input value={tmpKey} onChange={e=>setTmpKey(e.target.value)} type="password"
              placeholder="ADMIN_KEY" style={{width:'100%',padding:8,border:'1px solid #ccc',borderRadius:8}} />
          </label>
          <button type="submit" style={{padding:'10px 14px',borderRadius:8,border:'1px solid #222',cursor:'pointer'}}>Masuk</button>
          <p style={{color:'#666',fontSize:13}}>Admin Key diset di Environment Variables (ADMIN_KEY).</p>
        </form>
      ) : (
        <>
          <section style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap', marginBottom:16}}>
            <label>
              <div style={{fontSize:12,color:'#555'}}>Event ID</div>
              <input value={eventId} onChange={e=>setEventId(e.target.value)} style={{padding:8,border:'1px solid #ccc',borderRadius:8}} />
            </label>
            <label style={{flex:1,minWidth:240}}>
              <div style={{fontSize:12,color:'#555'}}>Cari (nama/email)</div>
              <input value={q} onChange={e=>setQ(e.target.value)} placeholder="mis. Budi"
                style={{width:'100%',padding:8,border:'1px solid #ccc',borderRadius:8}} />
            </label>
            <a
              href={`/api/admin/export?event_id=${encodeURIComponent(eventId)}`}
              onClick={e => { if(!adminKey){ e.preventDefault(); return; } }}
              style={{padding:'10px 14px',borderRadius:8,border:'1px solid #222',textDecoration:'none'}}
              target="_blank"
              rel="noreferrer"
            >Export CSV</a>
            <button onClick={logout} style={{padding:'10px 14px',borderRadius:8,border:'1px solid #e33',color:'#e33',cursor:'pointer'}}>Keluar</button>
          </section>

          {/* Upload CSV section */}
          <
