const GOOGLE_OAUTH_SETTING_ID = 'google_oauth_tokens';

export type GoogleOAuthTokens = {
  access_token?: string;
  refresh_token?: string;
  expiry_date?: number;
  scope?: string;
  token_type?: string;
};

const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const APPWRITE_SETTINGS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_SETTINGS_COLLECTION_ID!;
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY!;

/**
 * Store Google OAuth tokens securely in Appwrite using REST API
 */
export async function storeGoogleTokens(tokens: GoogleOAuthTokens): Promise<void> {
  const headers = {
    'Content-Type': 'application/json',
    'X-Appwrite-Project': APPWRITE_PROJECT_ID,
    'X-Appwrite-Key': APPWRITE_API_KEY,
  };

  const data = {
    key: 'google_oauth',
    value: JSON.stringify(tokens),
  };

  try {
    // Try to update existing document
    const updateResponse = await fetch(
      `${APPWRITE_ENDPOINT}/databases/${APPWRITE_DATABASE_ID}/collections/${APPWRITE_SETTINGS_COLLECTION_ID}/documents/${GOOGLE_OAUTH_SETTING_ID}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          data: data,
        }),
      },
    );

    if (!updateResponse.ok && updateResponse.status !== 404) {
      const errorText = await updateResponse.text();
      try {
        const jsonError = JSON.parse(errorText);
        throw new Error(`Failed to update tokens: ${jsonError.message || errorText}`);
      } catch (e) {
        throw new Error(`Failed to update tokens: ${errorText}`);
      }
    }

    // If document doesn't exist (404), create it
    if (updateResponse.status === 404) {
      const createResponse = await fetch(
        `${APPWRITE_ENDPOINT}/databases/${APPWRITE_DATABASE_ID}/collections/${APPWRITE_SETTINGS_COLLECTION_ID}/documents`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            documentId: GOOGLE_OAUTH_SETTING_ID,
            data: {
              ...data,
            },
          }),
        },
      );

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        try {
          const jsonError = JSON.parse(errorText);
          throw new Error(`Failed to create tokens: ${jsonError.message || errorText}`);
        } catch (e) {
          throw new Error(`Failed to create tokens: ${errorText}`);
        }
      }
    }
  } catch (error: any) {
    console.error('Error storing Google tokens:', error);
    throw error;
  }
}

/**
 * Retrieve Google OAuth tokens from Appwrite using REST API
 */
export async function getGoogleTokens(): Promise<GoogleOAuthTokens | null> {
  try {
    const response = await fetch(
      `${APPWRITE_ENDPOINT}/databases/${APPWRITE_DATABASE_ID}/collections/${APPWRITE_SETTINGS_COLLECTION_ID}/documents/${GOOGLE_OAUTH_SETTING_ID}`,
      {
        headers: {
          'X-Appwrite-Project': APPWRITE_PROJECT_ID,
          'X-Appwrite-Key': APPWRITE_API_KEY,
        },
      },
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to get tokens: ${response.statusText}`);
    }

    const document = await response.json();
    if (document && document.value) {
      return JSON.parse(document.value);
    }

    return null;
  } catch (error: any) {
    if (error.message?.includes('404')) {
      return null;
    }
    console.error('Error retrieving Google tokens:', error);
    throw error;
  }
}

/**
 * Delete Google OAuth tokens from Appwrite using REST API
 */
export async function deleteGoogleTokens(): Promise<void> {
  try {
    const response = await fetch(
      `${APPWRITE_ENDPOINT}/databases/${APPWRITE_DATABASE_ID}/collections/${APPWRITE_SETTINGS_COLLECTION_ID}/documents/${GOOGLE_OAUTH_SETTING_ID}`,
      {
        method: 'DELETE',
        headers: {
          'X-Appwrite-Project': APPWRITE_PROJECT_ID,
          'X-Appwrite-Key': APPWRITE_API_KEY,
        },
      },
    );

    if (!response.ok && response.status !== 404) {
      throw new Error(`Failed to delete tokens: ${response.statusText}`);
    }
  } catch (error: any) {
    if (!error.message?.includes('404')) {
      console.error('Error deleting Google tokens:', error);
      throw error;
    }
  }
}

/**
 * Check if Google OAuth is configured (client ID and secret exist)
 */
export function isOAuthConfigured(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}
