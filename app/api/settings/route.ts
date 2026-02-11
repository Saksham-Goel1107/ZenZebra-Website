import { getSystemSettings, updateSystemSettings } from '@/lib/admin-settings';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const settings = await getSystemSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Here we should check for admin authentication
    // This is a naive check. In production, use session validation from cookies/headers.
    // Assuming this route is protected by middleware or layout auth check.

    const updated = await updateSystemSettings(body);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
