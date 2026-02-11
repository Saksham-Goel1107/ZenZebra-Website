import { getAuthenticatedUser, getServerUsers } from '@/lib/appwrite-server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // 1. Authenticate the user
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { newPassword } = await request.json();

    // 2. Validate password
    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 },
      );
    }

    // 3. Update password using server-side Users API
    const users = getServerUsers();
    await users.updatePassword(user.$id, newPassword);

    // 4. Clear the mustResetPassword flag
    await users.updatePrefs(user.$id, {
      ...user.prefs,
      mustResetPassword: false,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Password reset error:', {
      message: error.message,
      type: error.type,
      code: error.code,
    });
    return NextResponse.json(
      { error: error.message || 'Failed to reset password' },
      { status: 500 },
    );
  }
}
