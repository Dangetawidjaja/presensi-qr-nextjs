'use client';

import { useEffect, useRef, useState } from 'react';

export default function Home() {
  const readerId = 'reader';
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    const init = async () => {
      const { Html5QrcodeScanner } = await import('html5-qrcode');
      const scanner = new Html5QrcodeScanner(readerId, { fps: 10, qrbox: 250 }, false);
      scanner.render(async (text: string) => {
        setStatus('Memproses...');
        try {
          let token = text;
          try {
            const url = new URL(text);
            token = url.searchParams.get('t') || text;
          } catch {}
          const event_id = process.env.NEXT_PUBLIC_EVENT_ID || 'EVENT_DEMO_123';
          const r = await fetch('/api/checkin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, event_id }),
          });
          const data = await r.json();
          if (data.ok && !data.alreadyCheckedIn) {
            setStatus(`✔️ Selamat datang, ${data.participant?.name || 'Peserta'}`);
          } else if (data.ok) {
            setStatus('ℹ️ Sudah check-in sebelumnya.');
          } else {
            setStatus(`❌ Gagal: ${data.error || 'Token tidak valid'}`);
          }
        } catch (e:any) {
          setStatus('❌ Terjadi kesalahan.');
        }
      }, () => {});
    };
    init();
  }, []);

  return (
    <main style={{maxWidth: 480, margin: '40px auto', padding: 16}}>
      <h1>Scan QR untuk Check-in</h1>
      <div id={readerId} style={{ width: '100%', minHeight: 320 }} />
      <p>{status}</p>
    </main>
  );
}
