import { validateOwner } from '@/lib/appwrite-server';
import { deleteSecret, listSecrets, updateSecret, updateSecrets } from '@/lib/doppler-api';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/doppler/secrets
 * List secrets for a project/config (owner-only)
 */
export async function GET(request: NextRequest) {
  try {
    const isOwner = await validateOwner(request);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden: Owner access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const project = searchParams.get('project');
    const config = searchParams.get('config');

    if (!project || !config) {
      return NextResponse.json(
        { error: 'Missing required parameters: project, config' },
        { status: 400 },
      );
    }

    const secrets = await listSecrets(project, config);

    return NextResponse.json({ secrets });
  } catch (error: any) {
    console.error('Failed to list secrets:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch secrets' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/admin/doppler/secrets
 * Create or update a secret (owner-only)
 */
export async function POST(request: NextRequest) {
  try {
    const isOwner = await validateOwner(request);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden: Owner access required' }, { status: 403 });
    }

    const body = await request.json();
    const { project, config, name, value, secrets } = body;

    if (!project || !config) {
      return NextResponse.json(
        { error: 'Missing required fields: project, config' },
        { status: 400 },
      );
    }

    if (secrets) {
      // Bulk update
      await updateSecrets(project, config, secrets);
    } else if (name && value) {
      // Single update
      await updateSecret(project, config, name, value);
    } else {
      return NextResponse.json(
        { error: 'Missing required fields: name/value or secrets' },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true, message: 'Secret updated successfully' });
  } catch (error: any) {
    console.error('Failed to update secret:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update secret' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/doppler/secrets
 * Delete a secret (owner-only)
 */
export async function DELETE(request: NextRequest) {
  try {
    const isOwner = await validateOwner(request);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden: Owner access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const project = searchParams.get('project');
    const config = searchParams.get('config');
    const name = searchParams.get('name');

    if (!project || !config || !name) {
      return NextResponse.json(
        { error: 'Missing required parameters: project, config, name' },
        { status: 400 },
      );
    }

    await deleteSecret(project, config, name);

    return NextResponse.json({ success: true, message: 'Secret deleted successfully' });
  } catch (error: any) {
    console.error('Failed to delete secret:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete secret' },
      { status: 500 },
    );
  }
}
