import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

/**
 * OAuth 2.0 Callback Endpoint
 * Handles the redirect from Google after user consent
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin-login/analytics?auth_error=${error}`,
    );
  }

  if (!code) {
    return NextResponse.json({ error: 'No authorization code received' }, { status: 400 });
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google/callback`,
    );

    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    // Store tokens securely in Appwrite database
    const { storeGoogleTokens } = await import('@/lib/google-oauth-storage');
    await storeGoogleTokens({
      access_token: tokens.access_token || undefined,
      refresh_token: tokens.refresh_token || undefined,
      expiry_date: tokens.expiry_date || undefined,
      scope: tokens.scope || undefined,
      token_type: tokens.token_type || undefined,
    });

    // Return tokens in a secure page where admin can copy them
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Google Analytics Authorization Success</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
      color: #fff;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      padding: 40px;
      max-width: 800px;
      width: 100%;
      backdrop-filter: blur(10px);
    }
    h1 {
      color: #4CAF50;
      margin-bottom: 10px;
      font-size: 28px;
    }
    p {
      color: rgba(255, 255, 255, 0.6);
      margin-bottom: 30px;
      line-height: 1.6;
    }
    .token-box {
      background: #000;
      border: 1px solid rgba(204, 34, 36, 0.3);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
      position: relative;
    }
    .token-label {
      color: #CC2224;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
    }
    .token-value {
      font-family: 'Courier New', monospace;
      font-size: 13px;
      color: rgba(255, 255, 255, 0.9);
      word-break: break-all;
      line-height: 1.8;
      user-select: all;
    }
    .copy-btn {
      position: absolute;
      top: 15px;
      right: 15px;
      background: #CC2224;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 12px;
      font-weight: bold;
      transition: all 0.2s;
    }
    .copy-btn:hover {
      background: #b01c1e;
      transform: scale(1.05);
    }
    .copy-btn.copied {
      background: #4CAF50;
    }
    .warning {
      background: rgba(255, 152, 0, 0.1);
      border: 1px solid rgba(255, 152, 0, 0.3);
      border-radius: 12px;
      padding: 20px;
      margin-top: 20px;
    }
    .warning-title {
      color: #FF9800;
      font-weight: bold;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .warning-text {
      color: rgba(255, 255, 255, 0.7);
      font-size: 14px;
      line-height: 1.6;
    }
    .steps {
      margin-top: 30px;
    }
    .step {
      margin-bottom: 15px;
      padding-left: 30px;
      position: relative;
    }
    .step-number {
      position: absolute;
      left: 0;
      top: 0;
      background: #CC2224;
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
    }
    .step-text {
      color: rgba(255, 255, 255, 0.8);
      font-size: 14px;
      line-height: 1.6;
    }
    code {
      background: rgba(255, 255, 255, 0.1);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      color: #4CAF50;
    }
    .done-btn {
      background: #4CAF50;
      color: white;
      border: none;
      padding: 14px 32px;
      border-radius: 12px;
      cursor: pointer;
      font-size: 16px;
      font-weight: bold;
      margin-top: 30px;
      width: 100%;
      transition: all 0.2s;
    }
    .done-btn:hover {
      background: #45a049;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>✓ Authorization Successful!</h1>
    <p>Your Google Analytics access has been granted and securely stored. You can now view real analytics data!</p>

    <div class="warning">
      <div class="warning-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        Tokens Stored Securely
      </div>
      <div class="warning-text">
        Your OAuth tokens have been automatically saved to your Appwrite database. They are encrypted and secure. No manual configuration needed!
      </div>
    </div>

    <div class="steps">
      <div class="step">
        <div class="step-number">✓</div>
        <div class="step-text">Tokens saved to Appwrite database</div>
      </div>
      <div class="step">
        <div class="step-number">✓</div>
        <div class="step-text">Google Analytics API access granted</div>
      </div>
      <div class="step">
        <div class="step-number">→</div>
        <div class="step-text">Click below to view your real analytics data</div>
      </div>
    </div>

    <button class="done-btn" onclick="window.location.href='/admin-login/analytics'">
      View Analytics Dashboard
    </button>
  </div>

  <script>
    function copyToken(elementId, button) {
      const element = document.getElementById(elementId);
      const text = element.textContent;

      navigator.clipboard.writeText(text).then(() => {
        button.textContent = 'Copied!';
        button.classList.add('copied');
        setTimeout(() => {
          button.textContent = 'Copy';
          button.classList.remove('copied');
        }, 2000);
      });
    }
  </script>
</body>
</html>
    `;

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
