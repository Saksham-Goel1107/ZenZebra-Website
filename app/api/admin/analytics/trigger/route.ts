import { getAuthenticatedUser } from '@/lib/appwrite-server';
import { NextRequest, NextResponse } from 'next/server';

const ANALYTICS_SECRET_KEY = process.env.ANALYTICS_SECRET_KEY;
const PYTHON_ANALYTICS_URL = process.env.PYTHON_ANALYTICS_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Please log in as admin' }, { status: 401 });
    }

    const body = await request.json();
    const {
      stockFileId,
      stockFileName,
      salesFileId,
      salesFileName,
      deadStockFileId,
      deadStockFileName,
    } = body;

    if (!stockFileId || !salesFileId) {
      return NextResponse.json(
        { error: 'Stock Report and Sales Report are required' },
        { status: 400 },
      );
    }

    // Call Python Analytics Engine
    console.log('Calling Python Analytics Engine:', `${PYTHON_ANALYTICS_URL}/analyze-triple`);

    const analyticsResponse = await fetch(`${PYTHON_ANALYTICS_URL}/analyze-triple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': ANALYTICS_SECRET_KEY || '',
      },
      body: JSON.stringify({
        stockFileId,
        stockFileName,
        salesFileId,
        salesFileName,
        deadStockFileId: deadStockFileId || null,
        deadStockFileName: deadStockFileName || null,
        uploadedBy: user.$id,
      }),
    });

    if (!analyticsResponse.ok) {
      const errorText = await analyticsResponse.text();
      console.error('Python Analytics Engine Error:', errorText);
      return NextResponse.json(
        { error: `Analytics engine failed: ${errorText}` },
        { status: analyticsResponse.status },
      );
    }

    const result = await analyticsResponse.json();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Analytics trigger failed:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
