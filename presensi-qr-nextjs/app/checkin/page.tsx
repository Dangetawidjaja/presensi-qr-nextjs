'use client';

import { useEffect, useState } from 'react';

export default function CheckinPage() {
  const [msg, setMsg] = useState('Menyiapkan...');

  useEffect(() => {
    const run = async () => {
      const p = new URLSearchParams(window.location.search);
      const token = p.get('t');
      const event_id = process.env.NEXT_PUBLIC_EVENT_ID || 'EVENT_DEMO_123';
      if (!token) { setMsg('Token tidak ditemukan di URL (?t=...)'); return; }
      try {
        const r = await fetch('/api/checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, event_id })
        });
        const data = await r.json();
        if (data.ok && !data.alreadyCheckedIn) {
          setMsg(`✔️ Selamat datang, ${data.participant?.name || 'Peserta'}`);
        } else if (data.ok) {
          setMsg('ℹ️ Sudah check-in sebelumnya.');
        } else {
          setMsg(`❌ Gagal: ${data.error || 'Token tidak valid'}`);
        }
      } catch (e) {
        setMsg('❌ Terjadi kesalahan.');
      }
    };
    run();
  }, []);

  return (
    <main style={{maxWidth: 480, margin: '40px auto', padding: 16}}>
      <h1>Check-in</h1>
      <p>{msg}</p>
    </main>
  );
}
