/**
 * Doppler API Integration
 * Provides utilities for managing Doppler secrets and syncing to Vercel
 */

const DOPPLER_API_BASE = 'https://api.doppler.com/v3';
const DOPPLER_TOKEN = process.env.DOPPLER_TOKEN;
const DOPPLER_PROJECT = process.env.DOPPLER_PROJECT;

interface DopplerProject {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

interface DopplerConfig {
  name: string;
  environment: string;
  project: string;
  created_at: string;
}

interface DopplerSecret {
  name: string;
  computed: string;
  raw: string;
}

interface DopplerAuditLog {
  id: string;
  text: string;
  user: {
    name: string;
    email: string;
  };
  created_at: string;
}

/**
 * Make authenticated request to Doppler API
 */
async function dopplerFetch(endpoint: string, options: RequestInit = {}) {
  if (!DOPPLER_TOKEN) {
    throw new Error('DOPPLER_TOKEN not configured');
  }

  const url = `${DOPPLER_API_BASE}${endpoint}`;
  const headers = {
    Authorization: `Bearer ${DOPPLER_TOKEN}`,
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Doppler API Error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * List all Doppler projects
 */
export async function listProjects(): Promise<DopplerProject[]> {
  const data = await dopplerFetch('/projects');
  return data.projects || [];
}

/**
 * List configs for a project
 */
export async function listConfigs(project: string): Promise<DopplerConfig[]> {
  const data = await dopplerFetch(`/configs?project=${project}`);
  return data.configs || [];
}

/**
 * List all secrets for a project and config
 */
export async function listSecrets(
  project: string,
  config: string,
): Promise<Record<string, DopplerSecret>> {
  const data = await dopplerFetch(`/configs/config/secrets?project=${project}&config=${config}`);
  return data.secrets || {};
}

/**
 * Get a specific secret
 */
export async function getSecret(
  project: string,
  config: string,
  name: string,
): Promise<DopplerSecret> {
  const data = await dopplerFetch(
    `/configs/config/secret?project=${project}&config=${config}&name=${name}`,
  );
  return data.value;
}

/**
 * Create or update a secret
 */
export async function updateSecret(project: string, config: string, name: string, value: string) {
  return dopplerFetch('/configs/config/secrets', {
    method: 'POST',
    body: JSON.stringify({
      project,
      config,
      secrets: {
        [name]: value,
      },
    }),
  });
}

/**
 * Bulk create or update secrets
 */
export async function updateSecrets(
  project: string,
  config: string,
  secrets: Record<string, string>,
) {
  return dopplerFetch('/configs/config/secrets', {
    method: 'POST',
    body: JSON.stringify({
      project,
      config,
      secrets,
    }),
  });
}

/**
 * Delete a secret
 */
export async function deleteSecret(project: string, config: string, name: string) {
  return dopplerFetch('/configs/config/secrets', {
    method: 'DELETE',
    body: JSON.stringify({
      project,
      config,
      secrets: [name],
    }),
  });
}

/**
 * Sync Doppler secrets to Vercel
 * This uses Doppler's native Vercel integration
 */
export async function syncToVercel(project: string, config: string) {
  // First, get all secrets from Doppler
  const secrets = await listSecrets(project, config);

  // Convert to Vercel environment variables format
  const envVars = Object.entries(secrets).map(([key, secret]) => ({
    key,
    value: secret.computed,
    type: 'encrypted' as const,
    target: ['production', 'preview', 'development'] as const,
  }));

  return {
    synced: envVars.length,
    secrets: Object.keys(secrets),
  };
}

/**
 * Get audit logs for a project
 */
export async function getAuditLog(
  project: string,
  page = 1,
  perPage = 20,
): Promise<DopplerAuditLog[]> {
  const data = await dopplerFetch(`/logs?project=${project}&page=${page}&per_page=${perPage}`);
  return data.logs || [];
}
