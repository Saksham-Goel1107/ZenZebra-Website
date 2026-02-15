import { appwriteConfig, getServerDatabases, validateOwner } from '@/lib/appwrite-server';
import { NextResponse } from 'next/server';
import { Query } from 'node-appwrite';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const databases = getServerDatabases();
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.partnerRequestsCollectionId,
      [Query.orderDesc('$createdAt'), Query.limit(limit), Query.offset(offset)],
    );

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('List Partner Requests Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to list requests' },
      { status: 500 },
    );
  }
}
