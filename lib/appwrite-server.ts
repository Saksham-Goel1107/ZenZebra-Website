import { Client, Databases } from 'node-appwrite';

/**
 * Server-side Appwrite Client
 * Uses API key for admin operations
 */
export const getServerClient = () => {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);

  return client;
};

export const getServerDatabases = () => {
  return new Databases(getServerClient());
};

export const appwriteConfig = {
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
  settingsCollectionId: process.env.NEXT_PUBLIC_APPWRITE_SETTINGS_COLLECTION_ID!,
  inquiriesCollectionId: process.env.NEXT_PUBLIC_APPWRITE_INQUIRIES_COLLECTION_ID!,
};
