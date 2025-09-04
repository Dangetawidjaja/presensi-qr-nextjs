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
            <button
              onClick={async () => {
                if (!adminKey) { alert('Masukkan ADMIN_KEY dulu'); return; }
                const res = await fetch(`/api/admin/export?event_id=${encodeURIComponent(eventId)}`, {
                  headers: { 'x-admin-key': adminKey }
                });
                if (!res.ok) {
                  const txt = await res.text();
                  alert('Gagal export: ' + txt);
                  return;
                }
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = `checkins_${eventId}.csv`;
                document.body.appendChild(a); a.click(); a.remove();
                URL.revokeObjectURL(url);
              }}
              style={{padding:'10px 14px',borderRadius:8,border:'1px solid #222',cursor:'pointer'}}
            >
              Export CSV
            </button>
            <button onClick={logout} style={{padding:'10px 14px',borderRadius:8,border:'1px solid #e33',color:'#e33',cursor:'pointer'}}>Keluar</button>
          </section>

          {/* Upload CSV section */}
          <section style={{border:'1px solid #ddd',borderRadius:12, padding:12, marginBottom:16}}>
            <h3 style={{marginTop:0}}>Upload CSV Peserta</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget as HTMLFormElement;
                const fd = new FormData(form);
                if (!adminKey) { alert('Masukkan ADMIN_KEY dulu'); return; }
                const res = await fetch(`/api/admin/upload`, {
                  method: 'POST',
                  headers: { 'x-admin-key': adminKey },
                  body: fd
                });
                if (!res.ok) {
                  const txt = await res.text();
                  alert('Gagal upload: ' + txt);
                  return;
                }
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = `tokens_${eventId}.csv`;
                document.body.appendChild(a); a.click(); a.remove();
                URL.revokeObjectURL(url);
                alert('Upload sukses. tokens.csv terunduh.');
              }}
              style={{display:'grid', gap:10}}
            >
              <input type="hidden" name="event_id" value={eventId} />
              <label>
                <div style={{fontSize:12,color:'#555'}}>File CSV (format: Nama,Email — tanpa header)</div>
                <input name="file" type="file" accept=".csv" required />
              </label>
              <label style={{display:'flex',alignItems:'center',gap:8}}>
                <input name="make_qr" type="checkbox" defaultChecked /> Generate & unggah QR ke Supabase Storage
              </label>
              <button type="submit" style={{padding:'10px 14px',border:'1px solid #222',borderRadius:8,cursor:'pointer'}}>
                Upload & Generate Token
              </button>

              {/* Cek Storage */}
              <div style={{marginTop:8}}>
                <button
                  type="button"
                  onClick={async () => {
                    if (!adminKey) { alert('Masukkan ADMIN_KEY dulu'); return; }
                    const res = await fetch(`/api/admin/storage-list?event_id=${encodeURIComponent(eventId)}`, {
                      headers: { 'x-admin-key': adminKey }
                    });
                    const json = await res.json();
                    if (!json.ok) { alert('Gagal list: ' + json.error); return; }
                    if (!json.files?.length) { alert('Belum ada file di qrs/' + eventId); return; }
                    const list = json.files.map((f: any) => f.name).join('\n');
                    alert('File di qrs/' + eventId + ':\n' + list);
                  }}
                  style={{padding:'8px 12px', border:'1px solid #666', borderRadius:8, cursor:'pointer'}}
                >
                  Lihat QR di Storage
                </button>
              </div>

              <small style={{color:'#666'}}>Catatan: Jika dicentang, QR PNG akan disimpan ke bucket Storage <code>qrs</code>.</small>
            </form>
          </section>
        </>
      )}
    </main>
  );
}
