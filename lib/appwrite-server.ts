import { cookies } from 'next/headers';
import { Client, Databases, Users } from 'node-appwrite';

/**
 * Server-side Appwrite Client
 * Uses API key for admin operations
 */
let clientInstance: Client | null = null;

export const getServerClient = () => {
  if (!clientInstance) {
    clientInstance = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY!);
  }
  return clientInstance;
};

export const getServerDatabases = () => {
  const client = getServerClient();
  return new Databases(client);
};

export const getServerUsers = () => {
  const client = getServerClient();
  return new Users(client);
};

/**
 * PRODUCTION AUTHENTICATION RESOLVER
 * Resolves user from Cookie or JWT
 */
export const getAuthenticatedUser = async (request: Request) => {
  try {
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    if (!projectId || !endpoint) return null;

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(`a_session_${projectId.toLowerCase()}`);
    const jwtHeader = request.headers.get('X-Appwrite-JWT');

    const headers: Record<string, string> = {
      'X-Appwrite-Project': projectId,
    };

    if (sessionCookie) {
      headers['Cookie'] = `a_session_${projectId.toLowerCase()}=${sessionCookie.value}`;
    } else if (jwtHeader) {
      headers['X-Appwrite-JWT'] = jwtHeader;
    } else {
      return null;
    }

    const response = await fetch(`${endpoint}/account`, { headers });
    if (!response.ok) return null;

    return await response.json();
  } catch (error) {
    console.error('Auth Resolver Error:', error);
    return null;
  }
};

export const isOwner = async (userId: string) => {
  try {
    const users = getServerUsers();
    const response = await users.list();
    // Sort by registration date ascending to find the first/oldest user
    const sorted = [...response.users].sort(
      (a, b) => new Date(a.registration).getTime() - new Date(b.registration).getTime(),
    );
    return sorted[0]?.$id === userId;
  } catch (error) {
    return false;
  }
};

export const validateOwner = async (request: Request) => {
  const user = await getAuthenticatedUser(request);
  if (!user) return false;
  return await isOwner(user.$id);
};

export const appwriteConfig = {
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
  settingsCollectionId: process.env.NEXT_PUBLIC_APPWRITE_SETTINGS_COLLECTION_ID!,
  inquiriesCollectionId: process.env.NEXT_PUBLIC_APPWRITE_INQUIRIES_COLLECTION_ID!,
};
