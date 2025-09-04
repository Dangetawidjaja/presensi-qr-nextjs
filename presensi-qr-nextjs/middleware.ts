import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = new URL(req.url);
  if (url.pathname.startsWith('/api/admin/')) {
    const provided = req.headers.get('x-admin-key') || '';
    const expected = process.env.ADMIN_KEY || '';
    if (!expected || provided !== expected) {
      return new NextResponse(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/admin/:path*'],
};
