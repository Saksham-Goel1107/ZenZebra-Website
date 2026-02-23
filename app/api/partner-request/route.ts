import { getSystemSettings } from '@/lib/admin-settings';
import { appwriteConfig, getServerDatabases } from '@/lib/appwrite-server';
import { formRateLimiter } from '@/lib/arcjet';
import { NextResponse } from 'next/server';
import { ID } from 'node-appwrite';
import { Pingram } from 'pingram';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9]{10}$/;

async function sendEmailNotification(to: string, subject: string, message: string) {
  try {
    const pingram = new Pingram({
      apiKey: process.env.PINGRAM_API_KEY!,
      baseUrl: 'https://api.pingram.io',
    });

    await pingram.send({
      type: 'zenzebra',
      to: {
        id: to,
        email: to,
      },
      email: {
        subject: subject,
        html: message.replace(/\n/g, '<br>'),
      },
    });
  } catch (error) {
    console.error('Pingram Notification Error:', error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, companyName, companyWebsite, remarks } = body;

    // 1. Arcjet Protection (Rate Limiting + Email Validation)
    const decision = await formRateLimiter.protect(request, {
      email, // Pass the email to Arcjet for validation
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429 },
        );
      }
      if (decision.reason.isEmail()) {
        return NextResponse.json(
          { error: 'Please provide a valid, non-disposable email address.' },
          { status: 400 },
        );
      }
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validation
    if (!name?.trim() || !email?.trim() || !phone || !companyName?.trim()) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const cleanPhone = phone.toString().replace(/\D/g, '');
    if (!PHONE_REGEX.test(cleanPhone)) {
      return NextResponse.json(
        { error: 'Phone number must be exactly 10 digits' },
        { status: 400 },
      );
    }

    // Prepare data object
    const documentData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: parseInt(cleanPhone, 10), // Store as integer
      companyName: companyName.trim(),
      companyWebsite: companyWebsite?.trim() || undefined,
      remarks: remarks?.trim() || undefined,
      status: 'Queued',
    };

    // Save to Appwrite
    const databases = getServerDatabases();
    await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.partnerRequestsCollectionId,
      ID.unique(),
      documentData,
    );

    // Send Confirmation Email
    const settings = await getSystemSettings();
    if (settings.emailNotificationsEnabled) {
      const subject = 'ZenZebra - Partner Request Submitted';

      const message = `Hello ${name.trim()},

Thank you for your interest in partnering with ZenZebra. Your request has been submitted successfully for ${companyName.trim()}.

Our partnerships team will review your details and get back to you shortly.

Best regards,
ZenZebra Team`;

      await sendEmailNotification(email.trim().toLowerCase(), subject, message);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Partner Request API Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to submit request' },
      { status: 500 },
    );
  }
}
