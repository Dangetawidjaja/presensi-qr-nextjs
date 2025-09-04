'use client';
import { useEffect, useState } from 'react';
export default function Home() {
  const [status, setStatus] = useState('');
  useEffect(() => {
    (async () => {
      const { Html5QrcodeScanner } = await import('html5-qrcode');
      const scanner = new Html5QrcodeScanner('reader', { fps: 10, qrbox: 250 }, false);
      scanner.render(async (text) => {
        setStatus('Memproses...');
        let token = text;
        try { const u = new URL(text); token = u.searchParams.get('t') || text; } catch {}
        const event_id = process.env.NEXT_PUBLIC_EVENT_ID || 'EVENT_DEMO_123';
        const r = await fetch('/api/checkin', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ token, event_id }) });
        const data = await r.json();
        if (data.ok && !data.alreadyCheckedIn) setStatus(`✔️ Selamat datang, ${data.participant?.name||'Peserta'}`);
        else if (data.ok) setStatus('ℹ️ Sudah check-in sebelumnya.');
        else setStatus(`❌ ${data.error||'Token tidak valid'}`);
      }, () => {});
    })();
  }, []);
  return (<main style={{maxWidth:480,margin:'40px auto',padding:16}}>
    <h1>Scan QR untuk Check-in</h1>
    <div id="reader" style={{width:'100%',minHeight:320}} />
    <p>{status}</p>
  </main>);
}
