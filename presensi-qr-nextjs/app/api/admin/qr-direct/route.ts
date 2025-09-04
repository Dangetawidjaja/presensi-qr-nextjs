export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
// @ts-ignore
import QRCode from 'qrcode';

function ok(req: NextRequest) {
  const provided = req.headers.get('x-admin-key') || '';
  const expected = process.env.ADMIN_KEY || '';
  return !!expected && provided === expected;
}

export async function POST(req: NextRequest) {
  if (!ok(req)) return NextResponse.json({ ok:false, error:'Unauthorized' }, { status:401 });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'https://YOUR-VERCEL-APP.vercel.app';

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok:false, error:'Missing SUPABASE env' }, { status:500 });
  }

  const body = await req.json().catch(()=>({}));
  const event_id = (body.event_id || 'EVENT_DEMO_123').replace(/[^a-z0-9_-]+/gi,'_');
  const token = body.token || 'TEST_TOKEN_123';
  const name = (body.name || 'TEST').replace(/[^a-z0-9_-]+/gi,'_');

  try {
    const url = `${PUBLIC_BASE_URL}/checkin?t=${encodeURIComponent(token)}`;
    const png: Buffer = await QRCode.toBuffer(url, { width: 512, margin: 2 });
    const bytes = new Uint8Array(png);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    try { /* @ts-ignore */ await supabase.storage.createBucket('qrs', { public: true }); } catch {}

    const path = `qrs/${event_id}/${name}.png`;
    const { error } = await supabase.storage.from('qrs').upload(path, bytes, {
      contentType: 'image/png',
      upsert: true
    });

    if (error) return NextResponse.json({ ok:false, step:'upload', path, error: error.message });

    const publicUrl = `${SUPABASE_URL.replace(/\/+$/,'')}/storage/v1/object/public/qrs/${event_id}/${encodeURIComponent(name)}.png`;
    return NextResponse.json({ ok:true, path, publicUrl });
  } catch (e:any) {
    return NextResponse.json({ ok:false, step:'qrgen', error: e?.message || String(e) });
  }
}
