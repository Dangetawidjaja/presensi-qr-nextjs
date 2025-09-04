import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

function hashToken(t: string) {
  return crypto.createHash('sha256').update(t).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = body?.token as string;
    const event_id = body?.event_id as string;
    if (!token || !event_id) return NextResponse.json({ ok: false, error: 'Missing token/event_id' }, { status: 400 });

    const SUPABASE_URL = process.env.SUPABASE_URL!;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ ok: false, error: 'Server misconfigured' }, { status: 500 });
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const token_hash = hashToken(token);

    // Find pass by token_hash and event_id
    const { data: pass, error: passErr } = await supabase
      .from('passes')
      .select('*')
      .eq('event_id', event_id)
      .eq('token_hash', token_hash)
      .maybeSingle();

    if (passErr) return NextResponse.json({ ok: false, error: 'DB error' }, { status: 500 });
    if (!pass) return NextResponse.json({ ok: false, error: 'Invalid token' }, { status: 404 });

    if (pass.used_at) {
      // already used
      return NextResponse.json({ ok: true, alreadyCheckedIn: true });
    }

    // Mark as used + create checkin
    const now = new Date().toISOString();
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const ua = req.headers.get('user-agent') || '';

    const { error: upErr } = await supabase
      .from('passes')
      .update({ used_at: now })
      .eq('id', pass.id);

    if (upErr) return NextResponse.json({ ok: false, error: 'Update failed' }, { status: 500 });

    const { error: ciErr } = await supabase
      .from('checkins')
      .insert({
        event_id,
        participant_name: pass.participant_name,
        participant_email: pass.participant_email,
        scanned_at: now,
        method: 'self',
        ip,
        user_agent: ua
      });

    if (ciErr) return NextResponse.json({ ok: false, error: 'Checkin log failed' }, { status: 500 });

    return NextResponse.json({ ok: true, participant: { name: pass.participant_name } });
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'Unexpected error' }, { status: 500 });
  }
}
