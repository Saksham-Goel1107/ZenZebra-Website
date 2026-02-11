import { Account, Avatars, Client, Databases, Storage } from 'appwrite';

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const avatars = new Avatars(client);

export const appwriteConfig = {
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
  locationsCollectionId: process.env.NEXT_PUBLIC_APPWRITE_LOCATIONS_COLLECTION_ID!,
  homeLocationsCollectionId: process.env.NEXT_PUBLIC_APPWRITE_HOME_LOCATIONS_COLLECTION_ID!,
  settingsCollectionId: process.env.NEXT_PUBLIC_APPWRITE_SETTINGS_COLLECTION_ID!,
  bucketId: process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!,
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!,
};

export const isOwner = async (userId: string | undefined) => {
  if (!userId) return false;
  try {
    const { jwt } = await account.createJWT();
    const res = await fetch('/api/admin/users', {
      headers: {
        'X-Appwrite-JWT': jwt,
      },
    });
    const users = await res.json();
    if (!Array.isArray(users)) return false;
    const sorted = [...users].sort(
      (a, b) => new Date(a.registration).getTime() - new Date(b.registration).getTime(),
    );
    return sorted[0]?.$id === userId;
  } catch {
    return false;
  }
};

export default client;
