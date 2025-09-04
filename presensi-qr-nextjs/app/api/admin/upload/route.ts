import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// @ts-ignore - modul 'qrcode' tidak punya deklarasi tipe resmi
import QRCode from 'qrcode';

function authOk(req: NextRequest) {
  const provided = req.headers.get('x-admin-key') || '';
  const expected = process.env.ADMIN_KEY || '';
  return !!expected && provided === expected;
}
function hashToken(t: string) {
  return crypto.createHash('sha256').update(t).digest('hex');
}
function randomToken(bytes = 24) {
  return crypto.randomBytes(bytes).toString('base64url');
}
function csvEscape(s: string) {
  const q = s.replace(/"/g, '""');
  return /[",\n]/.test(q) ? `"${q}"` : q;
}

export async function POST(req: NextRequest) {
  try {
    if (!authOk(req)) return new NextResponse('Unauthorized', { status: 401 });

    const SUPABASE_URL = process.env.SUPABASE_URL!;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new NextResponse('Server misconfigured', { status: 500 });
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const form = await req.formData();
    const event_id = (form.get('event_id') as string || '').trim();
    const make_qr = !!form.get('make_qr');
    const file = form.get('file') as File | null;

    if (!event_id) return new NextResponse('Missing event_id', { status: 400 });
    if (!file) return new NextResponse('Missing file', { status: 400 });

    const text = await file.text();
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

    const rowsOut: string[] = ['name,email,token,link'];
    const baseURL = process.env.PUBLIC_BASE_URL || 'https://YOUR-VERCEL-APP.vercel.app';

    for (const line of lines) {
      const [nameRaw, emailRaw = ''] = line.split(',');
      const name = (nameRaw || '').trim();
      const email = (emailRaw || '').trim();
      if (!name) continue;

      const token = randomToken();
      const token_hash = hashToken(token);

      const { error: insErr } = await supabase.from('passes').insert({
        event_id,
        participant_name: name,
        participant_email: email || null,
        token_hash
      });
      if (insErr) {
        console.error('Insert error', insErr);
        continue;
      }

      const link = `${baseURL}/checkin?t=${encodeURIComponent(token)}`;
      rowsOut.push([name, email, token, link].map(csvEscape).join(','));

      if (make_qr) {
        const pngBuffer = await QRCode.toBuffer(link, { width: 512, margin: 2 });
        const safe = (name || 'peserta').replace(/[^a-z0-9_-]+/gi, '_');
        const path = `qrs/${event_id}/${safe}.png`;
        await supabase.storage.from('qrs').upload(path, pngBuffer, {
          contentType: 'image/png',
          upsert: true
        });
      }
    }

    const csv = rowsOut.join('\n');
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="tokens_${event_id}.csv"`
      }
    });
  } catch (e: any) {
    console.error('Upload error', e);
    return new NextResponse('Unexpected error', { status: 500 });
  }
}
