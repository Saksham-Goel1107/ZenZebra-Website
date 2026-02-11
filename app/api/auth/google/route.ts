import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

/**
 * OAuth 2.0 Authorization Endpoint
 * Redirects user to Google's consent screen
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google/callback`,
  );

  if (action === 'revoke') {
    // Revoke the stored token
    try {
      const { getGoogleTokens, deleteGoogleTokens } = await import('@/lib/google-oauth-storage');
      const storedTokens = await getGoogleTokens();

      if (storedTokens && storedTokens.refresh_token) {
        oauth2Client.setCredentials({ refresh_token: storedTokens.refresh_token });
        await oauth2Client.revokeCredentials();
        await deleteGoogleTokens();
      }

      return NextResponse.json({
        success: true,
        message: 'Authorization revoked successfully.',
      });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // Generate authorization URL
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/analytics.readonly'],
    prompt: 'consent', // Force consent screen to get refresh token
  });

  return NextResponse.redirect(authUrl);
}
