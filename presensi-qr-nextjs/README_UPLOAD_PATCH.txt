Admin Upload CSV Patch

Files added/updated:
- app/api/admin/upload/route.ts  (API untuk unggah CSV -> insert passes, optional upload QR ke Storage)
- app/admin/page.tsx             (menambahkan form Upload CSV ke Dashboard)

Langkah pemasangan:
1) Ekstrak zip ini ke root project (sejajar package.json).
2) Pastikan env sudah ada:
   - ADMIN_KEY=... (Vercel & .env.local)
   - SUPABASE_URL=...
   - SUPABASE_SERVICE_ROLE_KEY=...
   - NEXT_PUBLIC_EVENT_ID=... (opsional, default event)
   - PUBLIC_BASE_URL=https://<app>.vercel.app
3) (Opsional) Buat bucket Storage "qrs" di Supabase bila ingin menyimpan PNG QR.
4) Commit & push -> Vercel auto deploy.
5) Buka /admin -> Upload CSV -> akan otomatis mengunduh tokens_<EVENT>.csv.
