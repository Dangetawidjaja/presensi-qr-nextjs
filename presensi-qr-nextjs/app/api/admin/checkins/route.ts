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
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { searchParams } = new URL(req.url);
  const event_id = searchParams.get('event_id') || process.env.NEXT_PUBLIC_EVENT_ID || '';
  const q = (searchParams.get('q') || '').trim().toLowerCase();

  const { data } = await supabase
    .from('checkins')
    .select('*')
    .eq('event_id', event_id)
    .order('scanned_at', { ascending: false })
    .limit(1000);

  const filtered = q
    ? (data || []).filter(r =>
        (r.participant_name || '').toLowerCase().includes(q) ||
        (r.participant_email || '').toLowerCase().includes(q)
      )
    : (data || []);

  return NextResponse.json({ ok: true, rows: filtered });
}
