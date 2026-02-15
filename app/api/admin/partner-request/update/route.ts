import { getSystemSettings } from '@/lib/admin-settings';
import { appwriteConfig, getServerDatabases, validateOwner } from '@/lib/appwrite-server';
import { NextResponse } from 'next/server';
import { Pingram } from 'pingram';

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
    const { id, status, email, name, companyName } = await request.json();

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update Status in Appwrite
    const databases = getServerDatabases();
    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.partnerRequestsCollectionId,
      id,
      { status },
    );

    // Send Email if status is 'onboarded'
    if (status === 'onboarded' && email && name) {
      const settings = await getSystemSettings();
      if (settings.emailNotificationsEnabled) {
        const subject = 'ZenZebra - Partner Request Onboarded';
        const message = `Hello ${name},

We are excited to inform you that your partner request for ${companyName || 'your company'} has been shifted to onboarded.

We hope you have a long and prosperous journey with us!

Best regards,
ZenZebra Team`;

        await sendEmailNotification(email, subject, message);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update Partner Request Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update request' },
      { status: 500 },
    );
  }
}
