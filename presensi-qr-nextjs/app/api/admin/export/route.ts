import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function authOk(req: NextRequest) {
  const provided = req.headers.get('x-admin-key') || '';
  const expected = process.env.ADMIN_KEY || '';
  return !!expected && provided === expected;
}

export async function GET(req: NextRequest) {
  if (!authOk(req)) return new NextResponse('Unauthorized', { status: 401 });

  const SUPABASE_URL = process.env.SUPABASE_URL!;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { searchParams } = new URL(req.url);
  const event_id = searchParams.get('event_id') || process.env.NEXT_PUBLIC_EVENT_ID || '';

  const { data } = await supabase
    .from('checkins')
    .select('participant_name,participant_email,scanned_at,method,ip,user_agent')
    .eq('event_id', event_id)
    .order('scanned_at', { ascending: false });

  const header = ['participant_name','participant_email','scanned_at','method','ip','user_agent'];
  const lines = [header.join(',')].concat(
    (data || []).map(r => header.map(k => {
      const cell = (r as any)[k] ?? '';
      const s = String(cell).replace(/"/g,'""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    }).join(','))
  );
  const csv = lines.join('\n');

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="checkins_${event_id}.csv"`
    }
  });
}
