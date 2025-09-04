export const metadata = { title: 'Presensi QR', description: 'Aplikasi presensi acara dengan QR.' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
