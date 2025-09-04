# Presensi QR (Next.js + Supabase)

Aplikasi presensi kehadiran sederhana dengan scan QR. Frontend + API di Next.js (host di Vercel), database di Supabase (Free tier).

## Fitur
- Scan QR via kamera HP (html5-qrcode)
- Link unik (?t=TOKEN) tanpa kamera
- Token unik sekali pakai (hash disimpan di DB)
- Endpoint `/api/checkin` menandai hadir
- Script generator token + **PNG QR siap cetak**

## Arsitektur Cepat
- **Vercel**: Deploy Next.js (App Router). Simpan `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` sebagai Environment Variables.
- **Supabase**: Postgres untuk tabel `passes` dan `checkins`.

## Skema Database (jalankan di Supabase SQL Editor)
```sql
-- Tabel peserta + pass (token) per event
create table if not exists public.passes (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,
  participant_name text not null,
  participant_email text,
  token_hash text not null unique,
  used_at timestamptz
);

-- Catatan check-in
create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,
  participant_name text not null,
  participant_email text,
  scanned_at timestamptz not null default now(),
  method text not null default 'self',
  ip text,
  user_agent text
);

-- Index untuk performa
create index if not exists idx_passes_event on public.passes(event_id);
create index if not exists idx_passes_token_hash on public.passes(token_hash);
```

> **Catatan:** Anda tidak perlu menaruh service role key di client. Hanya API Route server yang membaca `SUPABASE_SERVICE_ROLE_KEY`.

## Jalankan Lokal
```bash
pnpm i   # atau npm i / yarn
cp .env.example .env.local  # isi variabel
pnpm dev
```

## Deploy ke Vercel (Gratis)
1. Buat repo GitHub, upload kode ini.
2. Di Vercel: **New Project** → import repo.
3. **Environment Variables**:
   - `SUPABASE_URL` = dari Supabase Dashboard
   - `SUPABASE_SERVICE_ROLE_KEY` = service_role key (JANGAN expose di client)
   - `NEXT_PUBLIC_EVENT_ID` = ID event default (mis. `EVENT_DEMO_123`)
   - `PUBLIC_BASE_URL` = URL app (mis. `https://your-app.vercel.app`)
4. Deploy. Pastikan SQL di Supabase sudah dibuat.

## Alur Pakai
1. Import peserta ke file CSV (nama, email) atau siapkan list.
2. Jalankan script untuk **generate token dan QR**:
   ```bash
   pnpm generate:tokens participants.csv EVENT_DEMO_123
   ```
   Script akan:
   - membuat token acak per peserta
   - menyimpan hash token ke tabel `passes`
   - **menghasilkan gambar PNG QR** (link: `https://YOUR-APP.vercel.app/checkin?t=TOKEN`)
   - file output `dist/qrs/*.png` + `dist/tokens.csv` untuk rekap
3. Bagikan PNG QR ke peserta atau kirim linknya.
4. Hari H: buka halaman `/checkin` (untuk link) atau `/` (untuk scan kamera).

## Keamanan
- Token **sekali pakai**: jika sudah digunakan, percobaan kedua ditolak.
- Yang disimpan di DB hanya **hash** token (SHA-256). Token asli hanya ada di QR/link.
- Rate limit disarankan di level Vercel (Edge Function middleware) atau di Supabase (policies).

## Lisensi
MIT
