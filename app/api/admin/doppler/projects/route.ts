import { validateOwner } from '@/lib/appwrite-server';
import { listProjects } from '@/lib/doppler-api';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/doppler/projects
 * List all Doppler projects (owner-only)
 */
export async function GET(request: NextRequest) {
  try {
    const isOwner = await validateOwner(request);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden: Owner access required' }, { status: 403 });
    }

    const projects = await listProjects();

    return NextResponse.json({ projects });
  } catch (error: any) {
    console.error('Failed to list Doppler projects:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch projects' },
      { status: 500 },
    );
  }
}
