import { aj } from '@/lib/arcjet';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Bypass check for critical paths
  if (pathname === '/maintenance' || pathname === '/admin-disabled') {
    return NextResponse.next();
  }

  // 2. Arcjet Protection
  // We've moved heavy rules (email validation, etc) to arcjet-server.ts
  // to keep this middleware bundle under the 1MB Edge limit.
  const decision = await aj.protect(request);

  if (decision.isDenied()) {
    if (decision.reason.isBot()) {
      return NextResponse.json({ error: 'No bots allowed' }, { status: 403 });
    } else if (decision.reason.isRateLimit()) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 3. System Settings Check (Maintenance & Admin Lock)
  try {
    const {
      NEXT_PUBLIC_APPWRITE_ENDPOINT: endpoint,
      NEXT_PUBLIC_APPWRITE_PROJECT_ID: projectId,
      NEXT_PUBLIC_APPWRITE_DATABASE_ID: databaseId,
      NEXT_PUBLIC_APPWRITE_SETTINGS_COLLECTION_ID: collectionId,
      APPWRITE_API_KEY: apiKey,
    } = process.env;

    if (!endpoint || !projectId || !databaseId || !collectionId || !apiKey) {
      return NextResponse.next();
    }

    // Fetch settings via REST to avoid bringing the full SDK into the Edge bundle
    const response = await fetch(
      `${endpoint}/databases/${databaseId}/collections/${collectionId}/documents`,
      {
        headers: {
          'X-Appwrite-Project': projectId,
          'X-Appwrite-Key': apiKey,
        },
        // We use a short revalidate for settings
        next: { revalidate: 30 },
      } as any, // Cast to any because 'next' is a Next.js extension
    );

    if (!response.ok) return NextResponse.next();

    const data = await response.json();
    const documents = data.documents || [];

    let adminLocked = false;
    let maintenanceMode = false;

    for (const doc of documents) {
      if (doc.key === 'adminLocked') adminLocked = doc.value === 'true';
      if (doc.key === 'maintenanceMode') maintenanceMode = doc.value === 'true';
    }

    // Redirect logic
    if (pathname === '/maintenance' && !maintenanceMode) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    if (pathname === '/admin-disabled' && !adminLocked) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    if (adminLocked && pathname.startsWith('/admin-login')) {
      return NextResponse.redirect(new URL('/admin-disabled', request.url));
    }

    if (maintenanceMode && !pathname.startsWith('/admin-login') && pathname !== '/maintenance') {
      return NextResponse.redirect(new URL('/maintenance', request.url));
    }
  } catch (error) {
    console.error('Middleware Error:', error);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (png, jpg, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
