import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function authOk(req: NextRequest) {
  const provided = req.headers.get('x-admin-key') || '';
  const expected = process.env.ADMIN_KEY || '';
  return !!expected && provided === expected;
}

export async function GET(req: NextRequest) {
  if (!authOk(req)) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const SUPABASE_URL = process.env.SUPABASE_URL!;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: false, error: 'Server misconfigured' }, { status: 500 });
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { searchParams } = new URL(req.url);
  const event_id = searchParams.get('event_id') || process.env.NEXT_PUBLIC_EVENT_ID || '';

  const { count: total } = await supabase
    .from('passes')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', event_id);

  const { count: hadir } = await supabase
    .from('checkins')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', event_id);

  return NextResponse.json({
    ok: true,
    event_id,
    total: total || 0,
    hadir: hadir || 0,
    belum: Math.max((total || 0) - (hadir || 0), 0),
    attendance_rate: total ? ((hadir || 0) / total) : 0
  });
}
