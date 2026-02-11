import { NextResponse } from 'next/server';
import { Pingram } from 'pingram';

const appwriteConfig = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!,
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!,
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
  inquiriesCollectionId: process.env.NEXT_PUBLIC_APPWRITE_INQUIRIES_COLLECTION_ID || 'inquiries',
  apiKey: process.env.APPWRITE_API_KEY!,
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9]{10}$/;

async function fetchAppwrite(method: string, path: string, body?: any) {
  const { endpoint, projectId, apiKey } = appwriteConfig;
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Appwrite-Project': projectId,
      'X-Appwrite-Key': apiKey,
    },
    cache: 'no-store',
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(
    `${endpoint.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`,
    options,
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Appwrite error (${res.status}): ${text}`);
  }
  return res.json();
}

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
    const { name, email, phone, query } = body;

    if (!name?.trim() || !email?.trim() || !phone || !query?.trim()) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
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

    const phoneInt = parseInt(cleanPhone, 10);
    if (phoneInt < 1111111111 || phoneInt >= 10000000000) {
      return NextResponse.json({ error: 'Phone number out of range' }, { status: 400 });
    }

    // 4. Save to Appwrite via REST
    await fetchAppwrite(
      'POST',
      `/databases/${appwriteConfig.databaseId}/collections/${appwriteConfig.inquiriesCollectionId}/documents`,
      {
        documentId: Math.random().toString(36).substring(2) + Date.now().toString(36),
        data: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phoneInt,
          query: query.trim(),
          status: 'Queued',
        },
      },
    );

    // 5. Send Confirmation Email
    await sendEmailNotification(
      email.trim().toLowerCase(),
      'ZenZebra - Inquiry Received',
      `Hello ${name.trim()},\n\nThank you for reaching out to ZenZebra! We have received your query and it is currently: Queued.\n\nOur team will get back to you shortly.\n\nQuery: "${query.trim()}"`,
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Contact API Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to submit inquiry' },
      { status: 500 },
    );
  }
}
