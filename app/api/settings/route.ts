import { getSystemSettings, updateSystemSettings } from '@/lib/admin-settings';
import { validateOwner } from '@/lib/appwrite-server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    if (!(await validateOwner(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const settings = await getSystemSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await validateOwner(req))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const body = await req.json();
    const updated = await updateSystemSettings(body);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
