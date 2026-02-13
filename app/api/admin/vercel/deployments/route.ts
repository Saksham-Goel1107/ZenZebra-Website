import { validateOwner } from '@/lib/appwrite-server';
import { createDeployment, listDeployments } from '@/lib/vercel-api';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/vercel/deployments
 * List all deployments (owner-only)
 */
export async function GET(request: NextRequest) {
  try {
    const isOwner = await validateOwner(request);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden: Owner access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const deployments = await listDeployments(limit);

    return NextResponse.json({ deployments });
  } catch (error: any) {
    console.error('Failed to list deployments:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch deployments' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/admin/vercel/deployments
 * Trigger a new deployment (owner-only)
 */
export async function POST(request: NextRequest) {
  try {
    const isOwner = await validateOwner(request);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden: Owner access required' }, { status: 403 });
    }

    const body = await request.json();
    const { target = 'production' } = body;

    if (!['production', 'preview'].includes(target)) {
      return NextResponse.json(
        { error: 'Invalid target. Use "production" or "preview"' },
        { status: 400 },
      );
    }

    const deployment = await createDeployment(target);

    return NextResponse.json({ deployment });
  } catch (error: any) {
    console.error('Failed to create deployment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create deployment' },
      { status: 500 },
    );
  }
}
