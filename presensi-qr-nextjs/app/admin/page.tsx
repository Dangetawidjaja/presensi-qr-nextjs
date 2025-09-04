'use client';
import { useEffect, useState } from 'react';

function percent(n: number) {
  return (n * 100).toFixed(1) + '%';
}

export default function AdminPage() {
  const [eventId, setEventId] = useState<string>(process.env.NEXT_PUBLIC_EVENT_ID || 'EVENT_DEMO_123');
  const [adminKey, setAdminKey] = useState<string>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('ADMIN_KEY') || '' : ''
  );
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

        const r = await fetch(
          `/api/admin/checkins?event_id=${encodeURIComponent(eventId)}&q=${encodeURIComponent(q)}`,
          { headers: { 'x-admin-key': adminKey } }
        ).then(r => r.json());
        if (r.ok) setRows(r.rows || []); else setRows([]);
      } finally {
        setLoading(false);
      }
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
        <form onSubmit={login} style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
          <label>
            <div>Masukkan Admin Key</div>
            <input
              value={tmpKey}
              onChange={(e) => setTmpKey(e.target.value)}
              type="password"
              placeholder="ADMIN_KEY"
              style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 8 }}
            />
          </label>
          <button
            type="submit"
            style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #222', cursor: 'pointer' }}
          >
            Masuk
          </button>
          <p style={{ color: '#666', fontSize: 13 }}>Admin Key diset di Environment Variables (ADMIN_KEY).</p>
        </form>
      ) : (
        <>
          <section style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
            <label>
              <div style={{ fontSize: 12, color: '#555' }}>Event ID</div>
              <input
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                style={{ padding: 8, border: '1px solid #ccc', borderRadius: 8 }}
              />
            </label>
            <label style={{ flex: 1, minWidth: 240 }}>
              <div style={{ fontSize: 12, color: '#555' }}>Cari (nama/email)</div>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="mis. Budi"
                style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 8 }}
              />
            </label>
            <a
              href={`/api/admin/export?event_id=${encodeURIComponent(eventId)}`}
              onClick={(e) => {
                if (!adminKey) {
                  e.preventDefault();
                  return;
                }
              }}
              style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #222', textDecoration: 'none' }}
              target="_blank"
              rel="noreferrer"
            >
              Export CSV
            </a>
            <button
              onClick={logout}
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid #e33',
                color: '#e33',
                cursor: 'pointer'
              }}
            >
              Keluar
            </button>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
            <div style={{ border: '1px solid #ddd', borderRadius: 12, padding: 12 }}>
              <div style={{ fontSize: 12, color: '#666' }}>Total Peserta</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{stats?.total ?? '-'}</div>
            </div>
            <div style={{ border: '1px solid #ddd', borderRadius: 12, padding: 12 }}>
              <div style={{ fontSize: 12, color: '#666' }}>Hadir</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{stats?.hadir ?? '-'}</div>
            </div>
            <div style={{ border: '1px solid #ddd', borderRadius: 12, padding: 12 }}>
              <div style={{ fontSize: 12, color: '#666' }}>% Kehadiran</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{stats ? percent(stats.attendance_rate) : '-'}</div>
            </div>
          </section>

          <section style={{ border: '1px solid #ddd', borderRadius: 12, overflow: 'hidden' }}>
            <div
              style={{
                padding: 12,
                borderBottom: '1px solid #eee',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <strong>Daftar Check-in</strong>
              {loading && <span style={{ fontSize: 12, color: '#666' }}>memuat…</span>}
            </div>
            <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#fafafa' }}>
                  <tr>
                    <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #eee' }}>Waktu</th>
                    <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #eee' }}>Nama</th>
                    <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #eee' }}>Email</th>
                    <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #eee' }}>Method</th>
                    <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #eee' }}>IP</th>
                    <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #eee' }}>User-Agent</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f1f1' }}>
                      <td style={{ padding: 10 }}>{new Date(r.scanned_at).toLocaleString()}</td>
                      <td style={{ padding: 10 }}>{r.participant_name}</td>
                      <td style={{ padding: 10 }}>{r.participant_email || '-'}</td>
                      <td style={{ padding: 10 }}>{r.method}</td>
                      <td style={{ padding: 10 }}>{r.ip || '-'}</td>
                      <td
                        style={{
                          padding: 10,
                          maxWidth: 260,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        title={r.user_agent || ''}
                      >
                        {r.user_agent || '-'}
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: 16, color: '#666' }}>
                        Belum ada data.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
// (same content as provided earlier for AdminPage component)
