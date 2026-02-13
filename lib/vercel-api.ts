const VERCEL_API_BASE = 'https://api.vercel.com';
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;

interface VercelDeployment {
  uid: string;
  name: string;
  url: string;
  created: number;
  state: 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED';
  creator: {
    uid: string;
    username: string;
  };
  meta: {
    githubCommitRef?: string;
    githubCommitSha?: string;
    githubCommitMessage?: string;
  };
  target?: 'production' | 'staging' | null;
}

interface VercelDomain {
  name: string;
  verified: boolean;
  created: number;
}

interface VercelProject {
  id: string;
  name: string;
  framework?: string;
  updatedAt?: number;
  link?: {
    type: 'github' | 'gitlab' | 'bitbucket';
    repo: string;
    repoId: number | string;
    org?: string;
    productionBranch?: string;
  };
}

/**
 * Make authenticated request to Vercel API
 */
/**
 * Make authenticated request to Vercel API
 */
async function vercelFetch(endpoint: string, options: RequestInit & { quiet?: boolean } = {}) {
  if (!VERCEL_TOKEN) {
    throw new Error('VERCEL_TOKEN not configured');
  }

  const url = `${VERCEL_API_BASE}${endpoint}`;
  const headers = {
    Authorization: `Bearer ${VERCEL_TOKEN}`,
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (!options.quiet) {
    console.log(`[Vercel API] Fetching: ${url}`);
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const error = await response.text();

    // Silence 404s if quiet mode or generally to avoid spamming for optional features
    if (response.status !== 404 && !options.quiet) {
      console.error(`[Vercel API] Error ${response.status}:`, error);
    }

    if (response.status === 403) {
      throw new Error(
        `Vercel API Error: 403 Forbidden. Check your VERCEL_TOKEN and VERCEL_TEAM_ID in .env.`,
      );
    }
    throw new Error(`Vercel API Error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * List deployments for the project
 */
export async function listDeployments(limit = 20): Promise<VercelDeployment[]> {
  const teamParam = VERCEL_TEAM_ID ? `&teamId=${VERCEL_TEAM_ID}` : '';
  const projectParam = VERCEL_PROJECT_ID ? `&projectId=${VERCEL_PROJECT_ID}` : '';

  const data = await vercelFetch(`/v6/deployments?limit=${limit}${teamParam}${projectParam}`);

  return data.deployments || [];
}

/**
 * Get specific deployment details
 */
export async function getDeployment(deploymentId: string): Promise<VercelDeployment> {
  const teamParam = VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : '';
  return vercelFetch(`/v13/deployments/${deploymentId}${teamParam}`);
}

/**
 * Create a new deployment (redeploy)
 */
export async function createDeployment(
  target: 'production' | 'preview' | 'staging' | string = 'production',
) {
  if (!VERCEL_PROJECT_ID) {
    throw new Error('VERCEL_PROJECT_ID not configured');
  }

  // 1. Fetch project settings to get repoId
  let project: VercelProject;
  try {
    project = await getProjectSettings();
  } catch (e) {
    console.error('Failed to fetch project settings during deployment creation:', e);
    throw new Error('Could not fetch project settings to determine repository.');
  }

  const teamParam = VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : '';
  const normalizedTarget = target === 'staging' ? 'preview' : target; // API expects 'production' or undefined (defaults to preview) usually, or 'staging' if supported.

  const body: any = {
    name: VERCEL_PROJECT_ID,
    target: normalizedTarget,
  };

  if (project.link && project.link.repoId) {
    body.gitSource = {
      type: project.link.type,
      repoId: project.link.repoId,
      ref: target === 'production' ? project.link.productionBranch || 'main' : 'staging', // Assuming staging branch exists for non-prod
    };
  } else {
    // Fallback if not linked to git? Or throw?
    // Vercel requires gitSource for deployments triggered this way usually, unless using prebuilt assets.
    console.warn(
      'Project is not linked to a Git repository in Vercel. Attempting deployment without gitSource (might fail).',
    );
  }

  return vercelFetch(`/v13/deployments${teamParam}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Cancel an ongoing deployment
 */
export async function cancelDeployment(deploymentId: string) {
  const teamParam = VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : '';

  return vercelFetch(`/v12/deployments/${deploymentId}/cancel${teamParam}`, {
    method: 'PATCH',
  });
}

/**
 * Get deployment logs
 */
export async function getDeploymentLogs(deploymentId: string) {
  const teamParam = VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : '';

  // v3 logs endpoint or v2/events
  const data = await vercelFetch(`/v2/deployments/${deploymentId}/events${teamParam}`);

  return data;
}

/**
 * List domains for the project
 */
export async function listDomains(): Promise<VercelDomain[]> {
  if (!VERCEL_PROJECT_ID) {
    throw new Error('VERCEL_PROJECT_ID not configured');
  }

  const teamParam = VERCEL_TEAM_ID ? `&teamId=${VERCEL_TEAM_ID}` : '';

  const data = await vercelFetch(`/v9/projects/${VERCEL_PROJECT_ID}/domains?limit=50${teamParam}`);

  return data.domains || [];
}

/**
 * Get project settings
 */
export async function getProjectSettings(): Promise<VercelProject> {
  if (!VERCEL_PROJECT_ID) {
    throw new Error('VERCEL_PROJECT_ID not configured');
  }

  const teamParam = VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : '';

  return vercelFetch(`/v9/projects/${VERCEL_PROJECT_ID}${teamParam}`);
}


export async function promoteDeployment(deploymentId: string) {
  const teamParam = VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : '';

  // We use the "redeploy" endpoint creating a new deployment with the same source
  return vercelFetch(`/v13/deployments?forceNew=1${teamParam.replace('?', '&')}`, {
    method: 'POST',
    body: JSON.stringify({
      deploymentId,
      name: VERCEL_PROJECT_ID,
      target: 'production',
    }),
  });
}
