import { validateOwner } from '@/lib/appwrite-server';
import { cancelDeployment, getDeployment } from '@/lib/vercel-api';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/vercel/deployments/[id]
 * Get deployment details (owner-only)
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const isOwner = await validateOwner(request);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden: Owner access required' }, { status: 403 });
    }

    const { id } = await params;
    const deployment = await getDeployment(id);

    return NextResponse.json({ deployment });
  } catch (error: any) {
    console.error('Failed to get deployment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch deployment' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/vercel/deployments/[id]
 * Cancel a deployment (owner-only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const isOwner = await validateOwner(request);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden: Owner access required' }, { status: 403 });
    }

    const { id } = await params;
    await cancelDeployment(id);

    return NextResponse.json({ success: true, message: 'Deployment canceled' });
  } catch (error: any) {
    console.error('Failed to cancel deployment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel deployment' },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/admin/vercel/deployments/[id]
 * Promote/Rollback a deployment to production (owner-only)
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const isOwner = await validateOwner(request);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden: Owner access required' }, { status: 403 });
    }

    const { id } = await params;
    const { promoteDeployment } = await import('@/lib/vercel-api');

    const deployment = await promoteDeployment(id);

    return NextResponse.json({
      deployment,
      message: 'Deployment promoted/rolled back successfully',
    });
  } catch (error: any) {
    console.error('Failed to promote deployment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to promote deployment' },
      { status: 500 },
    );
  }
}
