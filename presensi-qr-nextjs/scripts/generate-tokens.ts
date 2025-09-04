/**
 * Generate tokens & PNG QR codes for participants and insert into Supabase.
 * Usage:
 *   pnpm generate:tokens participants.csv EVENT_ID
 *
 * CSV format (no header):
 *   name,email
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';

function hashToken(t: string) {
  return crypto.createHash('sha256').update(t).digest('hex');
}

function randomToken(bytes = 24) {
  return crypto.randomBytes(bytes).toString('base64url');
}

async function main() {
  const [,, csvPath, eventId] = process.argv;
  if (!csvPath || !eventId) {
    console.error('Usage: pnpm generate:tokens participants.csv EVENT_ID');
    process.exit(1);
  }
  const SUPABASE_URL = process.env.SUPABASE_URL!;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const baseURL = process.env.PUBLIC_BASE_URL || 'https://YOUR-VERCEL-APP.vercel.app';

  const raw = fs.readFileSync(csvPath, 'utf8').trim();
  const lines = raw.split(/\r?\n/).filter(Boolean);

  const outDir = path.join('dist');
  const qrDir = path.join(outDir, 'qrs');
  fs.mkdirSync(qrDir, { recursive: true });

  const tokensCsv = ['name,email,token,link'];
  for (const line of lines) {
    const [name, email] = line.split(',').map(s => s.trim());
    const token = randomToken();
    const token_hash = hashToken(token);

    const { error: upErr } = await supabase.from('passes').insert({
      event_id: eventId, participant_name: name, participant_email: email, token_hash
    });
    if (upErr) {
      console.error('Insert failed for', email, upErr.message);
      continue;
    }
    const link = baseURL + '/checkin?t=' + encodeURIComponent(token);
    tokensCsv.push(`${name},${email},${token},${link}`);

    const safeName = (name || 'peserta').replace(/[^a-z0-9_-]+/gi, '_');
    const filePng = path.join(qrDir, `${safeName}.png`);
    await QRCode.toFile(filePng, link, { width: 512, margin: 2 });
  }
  fs.writeFileSync(path.join(outDir, 'tokens.csv'), tokensCsv.join('\n'));
  console.log('Done. See dist/tokens.csv and dist/qrs/*.png');
}

main().catch(e => { console.error(e); process.exit(1); });
