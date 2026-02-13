import { validateOwner } from '@/lib/appwrite-server';
import { getAuditLog } from '@/lib/doppler-api';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/doppler/audit
 * Get Doppler audit logs (owner-only)
 */
export async function GET(request: NextRequest) {
  try {
    const isOwner = await validateOwner(request);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden: Owner access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const project = searchParams.get('project');
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '20');

    if (!project) {
      return NextResponse.json({ error: 'Missing required parameter: project' }, { status: 400 });
    }

    const logs = await getAuditLog(project, page, perPage);

    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error('Failed to get audit logs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch audit logs' },
      { status: 500 },
    );
  }
}
