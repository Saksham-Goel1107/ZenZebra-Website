import { validateOwner } from '@/lib/appwrite-server';
import { listDomains } from '@/lib/vercel-api';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/vercel/domains
 * List all domains (owner-only)
 */
export async function GET(request: NextRequest) {
  try {
    const isOwner = await validateOwner(request);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden: Owner access required' }, { status: 403 });
    }

    const domains = await listDomains();

    return NextResponse.json({ domains });
  } catch (error: any) {
    console.error('Failed to list domains:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch domains' },
      { status: 500 },
    );
  }
}
