import { NextResponse } from 'next/server';
import { Pingram } from 'pingram';

const appwriteConfig = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!,
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!,
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
  inquiriesCollectionId: process.env.NEXT_PUBLIC_APPWRITE_INQUIRIES_COLLECTION_ID || 'inquiries',
  apiKey: process.env.APPWRITE_API_KEY!,
};

async function fetchAppwrite(
  method: string,
  path: string,
  body?: any,
  params?: Record<string, string | string[]>,
) {
  const { endpoint, projectId, apiKey } = appwriteConfig;
  const cleanEndpoint = endpoint.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  let url = `${cleanEndpoint}${cleanPath}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => searchParams.append(key, v));
      } else {
        searchParams.append(key, value);
      }
    });
    url += `?${searchParams.toString()}`;
  }

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

  const res = await fetch(url, options);
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

export async function GET() {
  try {
    const data = await fetchAppwrite(
      'GET',
      `/databases/${appwriteConfig.databaseId}/collections/${appwriteConfig.inquiriesCollectionId}/documents`,
      null,
    );
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}

const ALLOWED_STATUSES = ['Queued', 'In_process', 'Completed', 'Discarded'];

export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const { status } = await request.json();

    if (!id || !status)
      return NextResponse.json({ error: 'ID and Status required' }, { status: 400 });

    // 1. Fetch current document to get user email
    const inquiry = await fetchAppwrite(
      'GET',
      `/databases/${appwriteConfig.databaseId}/collections/${appwriteConfig.inquiriesCollectionId}/documents/${id}`,
    );

    // 2. Update status
    await fetchAppwrite(
      'PATCH',
      `/databases/${appwriteConfig.databaseId}/collections/${appwriteConfig.inquiriesCollectionId}/documents/${id}`,
      { data: { status } },
    );

    // 3. Send Email Notification
    const statusLabel = status.replace('_', ' ');
    await sendEmailNotification(
      inquiry.email,
      `ZenZebra - Inquiry Update: ${statusLabel}`,
      `Hello ${inquiry.name},\n\nYour inquiry status has been updated to: ${statusLabel}.\n\nThank you for choosing ZenZebra!`,
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}

export async function DELETE() {
  return NextResponse.json({ error: 'Inquiry deletion is permanently disabled' }, { status: 403 });
}
