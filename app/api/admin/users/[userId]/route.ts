import { getServerUsers, validateOwner } from '@/lib/appwrite-server';
import { NextResponse } from 'next/server';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    // 1. Permission Check (Owner Only)
    if (!(await validateOwner(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { userId } = await params;

    // Check if target is owner
    // We import isOwner from lib/appwrite-server
    const { isOwner } = await import('@/lib/appwrite-server');
    if (await isOwner(userId)) {
      return NextResponse.json({ error: 'Cannot delete the owner account' }, { status: 403 });
    }

    const users = getServerUsers();

    try {
      await users.delete(userId);
    } catch (sdkError: any) {
      if (sdkError.message?.includes('instanceof')) {
        console.warn('SDK delete failure, falling back to REST...');
        const restResponse = await fetch(
          `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/users/${userId}`,
          {
            method: 'DELETE',
            headers: {
              'X-Appwrite-Project': process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!,
              'X-Appwrite-Key': process.env.APPWRITE_API_KEY!,
            },
          },
        );
        if (!restResponse.ok) throw new Error('REST Delete failed');
      } else {
        throw sdkError;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    // 1. Permission Check (Owner Only)
    if (!(await validateOwner(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { userId } = await params;
    const body = await request.json();
    const { status } = body;

    if (typeof status !== 'boolean') {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Check if target is owner
    const { isOwner } = await import('@/lib/appwrite-server');
    if (await isOwner(userId)) {
      return NextResponse.json(
        { error: 'Cannot block/unblock the owner account' },
        { status: 403 },
      );
    }

    const users = getServerUsers();
    await users.updateStatus(userId, status);

    return NextResponse.json({ success: true, status });
  } catch (error: any) {
    console.error('Error updating user status:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
