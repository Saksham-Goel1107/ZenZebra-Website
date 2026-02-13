import { validateOwner } from '@/lib/appwrite-server';
import { syncToVercel } from '@/lib/doppler-api';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/admin/doppler/sync
 * Sync Doppler secrets to Vercel (owner-only)
 */
export async function POST(request: NextRequest) {
  try {
    const isOwner = await validateOwner(request);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden: Owner access required' }, { status: 403 });
    }

    const body = await request.json();
    const { project, config } = body;

    if (!project || !config) {
      return NextResponse.json(
        { error: 'Missing required fields: project, config' },
        { status: 400 },
      );
    }

    const result = await syncToVercel(project, config);

    return NextResponse.json({
      success: true,
      message: `Synced ${result.synced} secrets to Vercel`,
      ...result,
    });
  } catch (error: any) {
    console.error('Failed to sync to Vercel:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync secrets to Vercel' },
      { status: 500 },
    );
  }
}
