import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Bypass static assets, API, and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    pathname.match(/\.(png|jpg|jpeg|svg|gif|webp)$/)
  ) {
    return NextResponse.next();
  }

  // 2. Allow direct access to Maintenance & Disabled pages to prevent loops
  if (pathname === '/maintenance' || pathname === '/admin-disabled') {
    return NextResponse.next();
  }

  try {
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
    const collectionId = process.env.NEXT_PUBLIC_APPWRITE_SETTINGS_COLLECTION_ID;
    const apiKey = process.env.APPWRITE_API_KEY;

    if (!endpoint || !projectId || !databaseId || !collectionId || !apiKey) {
      return NextResponse.next();
    }

    // 3. Fetch ALL System Settings via REST (Key-Value Format)
    // We fetch a list of documents. Each doc has `key` and `value`.
    const response = await fetch(
      `${endpoint}/databases/${databaseId}/collections/${collectionId}/documents`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': projectId,
          'X-Appwrite-Key': apiKey,
        },
        next: { revalidate: 30 },
      },
    );

    if (!response.ok) {
      return NextResponse.next();
    }

    const data = await response.json();
    const documents = data.documents || [];

    // 4. Find Critical flags
    let adminLocked = false;
    let maintenanceMode = false;

    // Iterate through docs to find keys
    for (const doc of documents) {
      if (doc.key === 'adminLocked' && doc.value === 'true') {
        adminLocked = true;
      }
      if (doc.key === 'maintenanceMode' && doc.value === 'true') {
        maintenanceMode = true;
      }
    }

    // 5. Restrict access to Utility Pages if not active
    if (pathname === '/maintenance' && !maintenanceMode) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    if (pathname === '/admin-disabled' && !adminLocked) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // 6. Check "Kill Switch" for Admin Dashboard
    if (adminLocked && pathname.startsWith('/admin-login')) {
      return NextResponse.redirect(new URL('/admin-disabled', request.url));
    }

    // 7. Check Maintenance Mode for Public Site
    // Block everything EXCEPT /admin-login (unless locked above)
    if (maintenanceMode && !pathname.startsWith('/admin-login') && pathname !== '/maintenance') {
      return NextResponse.redirect(new URL('/maintenance', request.url));
    }
  } catch (error) {
    console.error('Middleware Error:', error);
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
};
