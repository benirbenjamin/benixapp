/**
 * Vercel Domains API Integration Helper
 * 
 * Enables automatic registration, DNS verification, and deletion of custom
 * domains on the Vercel project hosting the Radio Platform.
 * 
 * Required Environment Variables in Vercel:
 * - VERCEL_AUTH_TOKEN: Personal access token or team token from https://vercel.com/account/tokens
 * - VERCEL_PROJECT_ID: Project ID found in Project Settings -> General (e.g. prj_...)
 * - VERCEL_TEAM_ID: Optional team ID if the project is under an organization/team
 */

const VERCEL_API_BASE = 'https://api.vercel.com';

export function isVercelConfigured() {
  return Boolean(process.env.VERCEL_AUTH_TOKEN && process.env.VERCEL_PROJECT_ID);
}

function getVercelHeaders() {
  const token = process.env.VERCEL_AUTH_TOKEN;
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

function getTeamQueryParam() {
  const teamId = process.env.VERCEL_TEAM_ID;
  return teamId ? `?teamId=${encodeURIComponent(teamId)}` : '';
}

/**
 * Register/add a custom domain to the Vercel project.
 * POST https://api.vercel.com/v10/projects/:projectId/domains
 */
export async function addDomainToVercel(domain) {
  if (!isVercelConfigured()) {
    console.log(`[VercelHelper] Vercel API credentials not set. Simulated domain addition for "${domain}".`);
    return {
      success: true,
      simulated: true,
      domain,
      verified: false,
      verification: [],
    };
  }

  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamParam = getTeamQueryParam();
  const url = `${VERCEL_API_BASE}/v10/projects/${encodeURIComponent(projectId)}/domains${teamParam}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getVercelHeaders(),
      body: JSON.stringify({ name: domain }),
    });

    const data = await response.json();

    if (!response.ok) {
      // If the domain is already added to this project, treat as success and fetch its status
      if (data?.error?.code === 'domain_already_in_use' || response.status === 409) {
        console.log(`[VercelHelper] Domain "${domain}" already registered on Vercel project.`);
        return await getDomainVercelStatus(domain);
      }
      console.error(`[VercelHelper] Failed to add domain "${domain}" to Vercel:`, data);
      return {
        success: false,
        error: data?.error?.message || `Failed to add domain to Vercel (${response.status})`,
        data,
      };
    }

    return {
      success: true,
      domain: data.name,
      verified: Boolean(data.verified),
      verification: data.verification || [],
      raw: data,
    };
  } catch (err) {
    console.error(`[VercelHelper] Network error adding domain "${domain}" to Vercel:`, err);
    return {
      success: false,
      error: err.message || 'Network error communicating with Vercel API',
    };
  }
}

/**
 * Trigger DNS & SSL verification on Vercel for a custom domain.
 * POST https://api.vercel.com/v9/projects/:projectId/domains/:domain/verify
 */
export async function verifyDomainOnVercel(domain) {
  if (!isVercelConfigured()) {
    console.log(`[VercelHelper] Vercel API credentials not set. Simulated domain verification for "${domain}".`);
    return {
      success: true,
      simulated: true,
      domain,
      verified: true,
    };
  }

  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamParam = getTeamQueryParam();
  const url = `${VERCEL_API_BASE}/v9/projects/${encodeURIComponent(projectId)}/domains/${encodeURIComponent(domain)}/verify${teamParam}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getVercelHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.warn(`[VercelHelper] Vercel verification check for "${domain}" returned status ${response.status}:`, data);
      return {
        success: false,
        verified: false,
        error: data?.error?.message || `Domain verification check failed (${response.status})`,
        verification: data?.verification || [],
      };
    }

    return {
      success: true,
      domain: data.name,
      verified: Boolean(data.verified),
      verification: data.verification || [],
      raw: data,
    };
  } catch (err) {
    console.error(`[VercelHelper] Network error verifying domain "${domain}" on Vercel:`, err);
    return {
      success: false,
      verified: false,
      error: err.message || 'Network error communicating with Vercel verification service',
    };
  }
}

/**
 * Fetch current status and DNS configuration from Vercel for a domain.
 * GET https://api.vercel.com/v9/projects/:projectId/domains/:domain
 * and GET https://api.vercel.com/v6/domains/:domain/config
 */
export async function getDomainVercelStatus(domain) {
  if (!isVercelConfigured()) {
    return {
      success: true,
      simulated: true,
      domain,
      verified: false,
      configured: false,
    };
  }

  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamParam = getTeamQueryParam();
  const domainUrl = `${VERCEL_API_BASE}/v9/projects/${encodeURIComponent(projectId)}/domains/${encodeURIComponent(domain)}${teamParam}`;
  const configUrl = `${VERCEL_API_BASE}/v6/domains/${encodeURIComponent(domain)}/config${teamParam}`;

  try {
    const [domainRes, configRes] = await Promise.all([
      fetch(domainUrl, { headers: getVercelHeaders() }),
      fetch(configUrl, { headers: getVercelHeaders() }),
    ]);

    const domainData = domainRes.ok ? await domainRes.json() : null;
    const configData = configRes.ok ? await configRes.json() : null;

    const isVerified = Boolean(domainData?.verified);
    const isMisconfigured = Boolean(configData?.misconfigured);

    return {
      success: Boolean(domainData),
      domain,
      verified: isVerified,
      misconfigured: isMisconfigured,
      configuredBy: configData?.configuredBy || null,
      verification: domainData?.verification || [],
      rawDomain: domainData,
      rawConfig: configData,
    };
  } catch (err) {
    console.error(`[VercelHelper] Error fetching Vercel status for "${domain}":`, err);
    return {
      success: false,
      domain,
      error: err.message,
    };
  }
}

/**
 * Remove a custom domain from the Vercel project.
 * DELETE https://api.vercel.com/v9/projects/:projectId/domains/:domain
 */
export async function removeDomainFromVercel(domain) {
  if (!isVercelConfigured()) {
    console.log(`[VercelHelper] Vercel API credentials not set. Simulated domain removal for "${domain}".`);
    return { success: true, simulated: true };
  }

  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamParam = getTeamQueryParam();
  const url = `${VERCEL_API_BASE}/v9/projects/${encodeURIComponent(projectId)}/domains/${encodeURIComponent(domain)}${teamParam}`;

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getVercelHeaders(),
    });

    if (!response.ok && response.status !== 404) {
      const data = await response.json().catch(() => ({}));
      console.warn(`[VercelHelper] Failed to remove domain "${domain}" from Vercel:`, data);
      return { success: false, error: data?.error?.message || `Failed with status ${response.status}` };
    }

    console.log(`[VercelHelper] Domain "${domain}" successfully removed from Vercel project.`);
    return { success: true };
  } catch (err) {
    console.error(`[VercelHelper] Network error removing domain "${domain}" from Vercel:`, err);
    return { success: false, error: err.message };
  }
}
