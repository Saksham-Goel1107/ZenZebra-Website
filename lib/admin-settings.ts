import { ID } from 'node-appwrite';

// Appwrite Config - Define locally if import fails, but we need settingsCollectionId
const appwriteConfig = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!,
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!,
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
  settingsCollectionId: process.env.NEXT_PUBLIC_APPWRITE_SETTINGS_COLLECTION_ID!,
  apiKey: process.env.APPWRITE_API_KEY!,
};

export interface SystemSettings {
  siteName: string;
  siteDescription: string;
  maintenanceMode: boolean; // Public site is down, Admin is accessible
  maintenanceMessage: string; // Custom message for maintenance page
  adminLocked: boolean; // Admin panel is strictly disabled (Kill Switch)
  supportEmail: string;
  supportPhone: string;
  googleAnalyticsId: string;
  socialInstagram: string;
  socialLinkedIn: string;
  logoUrl: string;
  ogImageUrl: string;
  emailNotificationsEnabled: boolean;
  inquiryConfirmationSubject: string;
  inquiryConfirmationTemplate: string;
  inquiryStatusUpdateSubject: string;
  inquiryStatusUpdateTemplate: string;
  analyticsChatbotEnabled: boolean;
}

const DEFAULT_SETTINGS: SystemSettings = {
  siteName: 'ZenZebra',
  siteDescription: 'Curated Lifestyle Where You Already Are',
  maintenanceMode: false,
  maintenanceMessage:
    "We're currently upgrading our systems to provide a better experience. Please check back soon.",
  adminLocked: false,
  supportEmail: 'support@zenzebra.in',
  supportPhone: '+91-9910605187',
  googleAnalyticsId: 'G-GM4Q02DG8S',
  socialInstagram: 'https://www.instagram.com/zenzebraindia/',
  socialLinkedIn: 'https://www.linkedin.com/company/zenzebraindia/',
  logoUrl:
    'https://fra.cloud.appwrite.io/v1/storage/buckets/698585f2000d68784efd/files/6985926d0013323cc0ca/view?project=698585dc0014c943f45e&mode=admin',
  ogImageUrl:
    'https://fra.cloud.appwrite.io/v1/storage/buckets/698585f2000d68784efd/files/6985926d0013323cc0ca/view?project=698585dc0014c943f45e&mode=admin',
  emailNotificationsEnabled: true,
  inquiryConfirmationSubject: 'ZenZebra - Inquiry Received: {name}',
  inquiryConfirmationTemplate:
    'Hello {name},\n\nThank you for reaching out to ZenZebra. We have received your inquiry regarding: {query}\n\nOur team will get back to you shortly.\n\nBest regards,\nZenZebra Team',
  inquiryStatusUpdateSubject: 'ZenZebra - Inquiry Update: {status}',
  inquiryStatusUpdateTemplate:
    'Hello {name},\n\nYour inquiry status has been updated to: {status}.\n\nThank you for choosing ZenZebra!',
  analyticsChatbotEnabled: true,
};

// --- Helpers ---
const parseValue = (key: string, value: string): any => {
  const defaultValue = DEFAULT_SETTINGS[key as keyof SystemSettings];
  if (typeof defaultValue === 'boolean') {
    return value === 'true';
  }
  return value;
};

const stringifyValue = (val: any): string => {
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  return String(val || '');
};

// --- REST API HELPER (Avoid SDK Runtime Issues) ---
async function fetchAppwrite(method: string, path: string, body?: any) {
  const { endpoint, projectId, apiKey } = appwriteConfig;

  if (!endpoint || !projectId || !apiKey) {
    console.warn('Appwrite configuration missing for settings fetch');
    return null;
  }

  // Ensure endpoint doesn't end with slash if path starts with one
  const cleanEndpoint = endpoint.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${cleanEndpoint}${cleanPath}`;

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

  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      // Log detailed error for debugging
      const text = await res.text();
      console.error(`Appwrite REST Error: ${res.status} ${res.statusText}`, text);
      return null; // Fail gracefully
    }
    return res.json();
  } catch (err) {
    console.error(`Fetch Error: ${err}`);
    return null;
  }
}

// --- Public Methods ---

export async function getSystemSettings(): Promise<SystemSettings> {
  // Query: limit(100) removed to prevent syntax errors. Default 25 is enough.
  const data = await fetchAppwrite(
    'GET',
    `/databases/${appwriteConfig.databaseId}/collections/${appwriteConfig.settingsCollectionId}/documents`,
  );

  if (!data || !data.documents) {
    return DEFAULT_SETTINGS;
  }

  const settings: any = { ...DEFAULT_SETTINGS };
  data.documents.forEach((doc: any) => {
    // @ts-ignore
    if (doc.key && doc.key in DEFAULT_SETTINGS) {
      settings[doc.key] = parseValue(doc.key, doc.value);
    }
  });

  return settings as SystemSettings;
}

export async function updateSystemSettings(
  newSettings: Partial<SystemSettings>,
): Promise<SystemSettings> {
  // 1. Fetch current docs to get IDs
  const data = await fetchAppwrite(
    'GET',
    `/databases/${appwriteConfig.databaseId}/collections/${appwriteConfig.settingsCollectionId}/documents`,
  );

  const existingMap = new Map();
  if (data && data.documents) {
    data.documents.forEach((doc: any) => existingMap.set(doc.key, doc.$id));
  }

  // 2. Iterate and update
  const updates = Object.entries(newSettings).map(async ([key, value]) => {
    // @ts-ignore
    if (!(key in DEFAULT_SETTINGS)) return;

    const strVal = stringifyValue(value);
    const existingId = existingMap.get(key);

    if (existingId) {
      // Update via PATCH: { data: { value } }
      // Based on Appwrite Docs for Update Document, the body should be the attributes object directly.
      await fetchAppwrite(
        'PATCH',
        `/databases/${appwriteConfig.databaseId}/collections/${appwriteConfig.settingsCollectionId}/documents/${existingId}`,
        { data: { value: strVal } },
      );
    } else {
      // Create via POST: { documentId, data: { key, value } }
      // Appwrite Create Document endpoint requires `documentId` and `data` object wrapper for attributes?
      // NO. It requires `documentId`, `data` (optional), `permissions` (optional).
      // Wait, for Create Document, the body params are `documentId` and `data`.
      // For Update Document, the body params are `data`, `permissions`.
      // Let's verify standard REST structure.
      // V1 Database API:
      // CREATE: POST /documents. Body: { documentId: "...", data: { ... }, permissions: [] }
      // UPDATE: PATCH /documents/{id}. Body: { data: { ... }, permissions: [] }

      await fetchAppwrite(
        'POST',
        `/databases/${appwriteConfig.databaseId}/collections/${appwriteConfig.settingsCollectionId}/documents`,
        {
          documentId: ID.unique(),
          data: { key, value: strVal },
        },
      );
    }
  });

  await Promise.all(updates);

  return getSystemSettings();
}
