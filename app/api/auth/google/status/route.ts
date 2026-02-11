import { google } from 'googleapis';
import { NextResponse } from 'next/server';

/**
 * Check OAuth Authorization Status
 */
export async function GET() {
  const hasClientId = !!process.env.GOOGLE_CLIENT_ID;
  const hasClientSecret = !!process.env.GOOGLE_CLIENT_SECRET;

  if (!hasClientId || !hasClientSecret) {
    return NextResponse.json({
      authorized: false,
      configured: false,
      message:
        'OAuth client credentials not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env',
    });
  }

  // Check for tokens in Appwrite database
  const { getGoogleTokens } = await import('@/lib/google-oauth-storage');
  const storedTokens = await getGoogleTokens();

  if (!storedTokens || !storedTokens.refresh_token) {
    return NextResponse.json({
      authorized: false,
      configured: true,
      message:
        'OAuth client configured but not authorized. Click "Authorize with Google" to grant access.',
    });
  }

  // Test if the refresh token is valid
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google/callback`,
    );

    oauth2Client.setCredentials({
      refresh_token: storedTokens.refresh_token,
    });

    // Try to get a fresh access token
    const { credentials } = await oauth2Client.refreshAccessToken();

    // Update stored tokens with new access token
    const { storeGoogleTokens } = await import('@/lib/google-oauth-storage');
    await storeGoogleTokens({
      ...storedTokens,
      access_token: credentials.access_token || undefined,
      expiry_date: credentials.expiry_date || undefined,
    });

    return NextResponse.json({
      authorized: true,
      configured: true,
      expiresAt: credentials.expiry_date,
      message: 'Successfully authorized with Google Analytics',
    });
  } catch (error: any) {
    return NextResponse.json({
      authorized: false,
      configured: true,
      error: error.message,
      message: 'Refresh token is invalid or expired. Please re-authorize.',
    });
  }
}
