import { validateOwner } from '@/lib/appwrite-server';
import { getDeploymentLogs } from '@/lib/vercel-api';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/vercel/deployments/[id]/logs
 * Get deployment logs (owner-only)
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const isOwner = await validateOwner(request);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden: Owner access required' }, { status: 403 });
    }

    const { id } = await params;
    const logs = await getDeploymentLogs(id);

    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error('Failed to get deployment logs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch deployment logs' },
      { status: 500 },
    );
  }
}
