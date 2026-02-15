import { getServerUsers, validateOwner } from '@/lib/appwrite-server';
import { secureError, secureLog } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { Pingram } from 'pingram';

const pingram = new Pingram({
  apiKey: process.env.PINGRAM_API_KEY!,
});

export async function GET(request: Request) {
  try {
    // 1. Permission Check (Owner Only)
    if (!(await validateOwner(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const users = getServerUsers();
    const response = await users.list();
    // Sort by registration date decending
    const sortedUsers = [...response.users].sort(
      (a, b) => new Date(b.registration).getTime() - new Date(a.registration).getTime(),
    );
    return NextResponse.json(sortedUsers);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: error.message }, { status: error.code || 500 });
  }
}

export async function POST(request: Request) {
  try {
    // 1. Permission Check (Owner Only)
    if (!(await validateOwner(request))) {
      return NextResponse.json(
        { error: 'Unauthorized: Only the primary admin can authorize user creation.' },
        { status: 403 },
      );
    }

    const { email, password, name } = await request.json();

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 },
      );
    }

    const users = getServerUsers();

    let response;
    try {
      // 2. Create User
      response = await users.create(
        'unique',
        email,
        undefined, // phone
        password,
        name,
      );

      // 3. Auto-Verify Email & Set Preferences
      // Automatically mark email as verified since admin created it
      await users.updateEmailVerification(response.$id, true);

      // Enforce security policies (MFA + Password Reset)
      await users.updatePrefs(response.$id, {
        mustResetPassword: true,
        mfaRequired: true,
      });

      // 4. Send Welcome Email via Pingram (WITHOUT password for security)
      try {
        secureLog('Attempting to send welcome email to:', email);
        const emailResult = await pingram.send({
          type: 'zenzebra',
          to: {
            id: email,
            email: email.toLowerCase(),
          },
          email: {
            subject: 'ZenZebra Command - Your Admin Account Created',
            html: `
              <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; padding: 40px;">
                <h1 style="color: #CC2224; text-transform: uppercase; font-style: italic;">Welcome to the Team, ${name}</h1>
                <p>Your ZenZebra admin account has been created successfully.</p>
                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p><strong>Login URL:</strong> <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin-login">${process.env.NEXT_PUBLIC_APP_URL}/admin-login</a></p>
                  <p><strong>Email:</strong> ${email}</p>
                  <p><strong>Password:</strong> ${password}</p>
                </div>
                <p style="color: #CC2224; font-weight: bold;">SECURITY REQUIREMENTS:</p>
                <ul style="line-height: 1.8;">
                  <li>You must <strong>change your password</strong> on first login</li>
                  <li>You must <strong>enable MFA</strong> (Two-Factor Authentication)</li>
                  <li>Keep your credentials secure and never share them</li>
                </ul>
                <p style="color: #999; font-size: 12px; margin-top: 30px;">This email contains sensitive information. Please delete it after setting up your account.</p>
                <p>Regards,<br>ZenZebra</p>
              </div>
            `,
            senderName: 'ZenZebra',
            senderEmail: 'noreply@noreply.zenzebra.in',
          },
        });
        secureLog('Welcome email sent successfully');
      } catch (emailError: any) {
        secureError('PINGRAM EMAIL FAILURE:', {
          message: emailError.message,
          status: emailError.response?.status,
          email: email,
        });
        // We still return success since the user was created
      }
    } catch (sdkError: any) {
      // Fallback to REST API if SDK fails (instanceof issue)
      if (sdkError.message?.includes('instanceof')) {
        console.warn('SDK failure detected, falling back to REST API...');
        const restResponse = await fetch(`${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Appwrite-Project': process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!,
            'X-Appwrite-Key': process.env.APPWRITE_API_KEY!,
          },
          body: JSON.stringify({
            userId: 'unique',
            email,
            password,
            name,
          }),
        });

        if (!restResponse.ok) {
          const errorData = await restResponse.json();
          throw new Error(errorData.message || 'REST API fallback failed');
        }
        response = await restResponse.json();

        // Also set prefs via REST
        await fetch(`${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/users/${response.$id}/prefs`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-Appwrite-Project': process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!,
            'X-Appwrite-Key': process.env.APPWRITE_API_KEY!,
          },
          body: JSON.stringify({
            prefs: {
              mustResetPassword: true,
              mfaRequired: true,
            },
          }),
        });
      } else {
        throw sdkError;
      }
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Final User Creation Error:', {
      message: error.message,
      code: error.code,
      type: error.type,
    });

    const message =
      error.type === 'user_already_exists' || error.message?.includes('already exists')
        ? 'A user with this email already exists'
        : error.message || 'Failed to create user';

    return NextResponse.json({ error: message }, { status: error.code || 500 });
  }
}
