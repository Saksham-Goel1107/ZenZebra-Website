import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { GoogleAuth } from 'google-auth-library';
import { NextResponse } from 'next/server';

/**
 * GA4 Traffic Analytics API Route
 *
 * Keyless Authentication v4: Hardened against background unhandled promise rejections.
 */

const propertyId = process.env.GA_PROPERTY_ID;

export async function GET() {
  // 1. Mock data fallback for missing Property ID
  if (!propertyId) {
    return NextResponse.json({
      message: 'GA_PROPERTY_ID is not configured. Showing demo data.',
      ...getMockData(),
    });
  }

  try {
    // 2. Initialize Auth
    const authOptions: any = {
      scopes: 'https://www.googleapis.com/auth/analytics.readonly',
    };

    // Support for Service Account Auth (Key-based) - for production deployments
    const hasServiceAccount = process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY;

    if (hasServiceAccount) {
      authOptions.credentials = {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      };
      authOptions.projectId = process.env.GOOGLE_CLOUD_PROJECT;
    } else {
      // Support for OAuth (User-based) - retrieve tokens from Appwrite
      try {
        const { getGoogleTokens } = await import('@/lib/google-oauth-storage');
        const storedTokens = await getGoogleTokens();

        if (storedTokens && storedTokens.refresh_token) {
          authOptions.credentials = {
            type: 'authorized_user',
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            refresh_token: storedTokens.refresh_token,
          };
        }
      } catch (e) {
        console.warn('Failed to retrieve Google tokens from Appwrite', e);
      }
    }

    const auth = new GoogleAuth(authOptions);

    /**
     * 3. ADAPTIVE AUTH CHECK
     * We try to get a token. This will pick up:
     * - Environment Variables (if set)
     * - gcloud auth application-default login (local dev)
     * - Identity-based auth (if deployed to GCP)
     */
    try {
      // Use a short timeout to prevent hanging if no credentials exist
      await Promise.race([
        auth.getAccessToken(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Auth Timeout')), 3000)),
      ]);
    } catch (authError: any) {
      // If auth fails and we are in dev, show demo data instead of crashing
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({
          message:
            'No active Google session found. Use `gcloud auth application-default login` for real data.',
          ...getMockData(),
          isMock: true,
        });
      }

      return NextResponse.json({
        error: 'Authentication failed.',
        details: authError.message,
        ...getMockData(),
        isMock: true,
      });
    }

    // 4. Initialize Client ONLY if auth passed
    const client = new BetaAnalyticsDataClient({ auth });

    /**
     * 5. Run Reports inside an additional safety wrapper
     * We don't use Promise.all here to ensure we can catch individual failures
     * without one rejection killing the catch block or leaving unhandled tasks.
     */
    const getReportData = async () => {
      // Metric: Active Users in last 30 minutes
      const [realtime] = await client.runRealtimeReport({
        property: `properties/${propertyId}`,
        dimensions: [{ name: 'deviceCategory' }, { name: 'country' }, { name: 'city' }],
        metrics: [{ name: 'activeUsers' }],
      });

      // Report: Daily Trends (Users, New Users, Sessions, Engagement) - Last 28 Days
      const [daily] = await client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'date' }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'newUsers' },
          { name: 'sessions' },
          { name: 'userEngagementDuration' },
        ],
        orderBys: [{ dimension: { orderType: 'ALPHANUMERIC', dimensionName: 'date' } }],
      });

      // Report: Top Pages by Views & Engagement
      const [pages] = await client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'pageTitle' }, { name: 'pagePath' }],
        metrics: [
          { name: 'screenPageViews' },
          { name: 'activeUsers' },
          { name: 'userEngagementDuration' }, // Total engagement time
          { name: 'engagementRate' },
        ],
        limit: 20,
      });

      // Report: Acquisition (Source / Medium)
      const [acquisition] = await client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
        metrics: [{ name: 'sessions' }, { name: 'activeUsers' }, { name: 'engagementRate' }],
        limit: 15,
      });

      // Report: Tech (Browser, OS, Device)
      const [tech] = await client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
        dimensions: [
          { name: 'browser' },
          { name: 'operatingSystem' },
          { name: 'deviceCategory' },
          { name: 'screenResolution' },
        ],
        metrics: [{ name: 'activeUsers' }],
        limit: 20,
      });

      // Report: Demographics (Country, City, Language)
      const [geo] = await client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'country' }, { name: 'city' }, { name: 'language' }],
        metrics: [{ name: 'activeUsers' }],
        limit: 50,
      });

      // Report: Overview totals
      const [overview] = await client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'newUsers' },
          { name: 'sessions' },
          { name: 'averageSessionDuration' },
          { name: 'engagementRate' },
          { name: 'bounceRate' },
        ],
      });

      return { realtime, daily, pages, acquisition, tech, geo, overview };
    };

    const results = await getReportData();

    // 6. Map and return response
    return NextResponse.json({
      overview: {
        totalUsers: parseInt(results.overview.rows?.[0]?.metricValues?.[0]?.value || '0'),
        newUsers: parseInt(results.overview.rows?.[0]?.metricValues?.[1]?.value || '0'),
        sessions: parseInt(results.overview.rows?.[0]?.metricValues?.[2]?.value || '0'),
        avgSessionDuration: parseFloat(results.overview.rows?.[0]?.metricValues?.[3]?.value || '0'),
        engagementRate: parseFloat(results.overview.rows?.[0]?.metricValues?.[4]?.value || '0'),
        bounceRate: parseFloat(results.overview.rows?.[0]?.metricValues?.[5]?.value || '0'),
      },
      realtime:
        results.realtime.rows?.map((row) => ({
          device: row.dimensionValues?.[0].value || 'unknown',
          country: row.dimensionValues?.[1].value || 'unknown',
          city: row.dimensionValues?.[2].value || 'unknown',
          users: parseInt(row.metricValues?.[0].value || '0'),
        })) || [],
      daily:
        results.daily.rows
          ?.map((row) => ({
            date: row.dimensionValues?.[0].value || '',
            users: parseInt(row.metricValues?.[0].value || '0'),
            newUsers: parseInt(row.metricValues?.[1].value || '0'),
            sessions: parseInt(row.metricValues?.[2].value || '0'),
            engagementDuration: parseInt(row.metricValues?.[3].value || '0'),
          }))
          .sort((a, b) => a.date.localeCompare(b.date)) || [],
      topPages:
        results.pages.rows?.map((row) => ({
          title: row.dimensionValues?.[0].value || 'Untitled',
          path: row.dimensionValues?.[1].value || '/',
          views: parseInt(row.metricValues?.[0].value || '0'),
          users: parseInt(row.metricValues?.[1].value || '0'),
          engagementDuration: parseInt(row.metricValues?.[2].value || '0'),
          engagementRate: parseFloat(row.metricValues?.[3].value || '0'),
        })) || [],
      acquisition:
        results.acquisition.rows?.map((row) => ({
          source: row.dimensionValues?.[0].value || '(direct)',
          medium: row.dimensionValues?.[1].value || '(none)',
          sessions: parseInt(row.metricValues?.[0].value || '0'),
          users: parseInt(row.metricValues?.[1].value || '0'),
          engagementRate: parseFloat(row.metricValues?.[2].value || '0'),
        })) || [],
      tech:
        results.tech.rows?.map((row) => ({
          browser: row.dimensionValues?.[0].value || 'unknown',
          os: row.dimensionValues?.[1].value || 'unknown',
          device: row.dimensionValues?.[2].value || 'unknown',
          resolution: row.dimensionValues?.[3].value || 'unknown',
          users: parseInt(row.metricValues?.[0].value || '0'),
        })) || [],
      geo:
        results.geo.rows?.map((row) => ({
          country: row.dimensionValues?.[0].value || 'unknown',
          city: row.dimensionValues?.[1].value || 'unknown',
          language: row.dimensionValues?.[2].value || 'unknown',
          users: parseInt(row.metricValues?.[0].value || '0'),
        })) || [],
      isMock: false,
    });
  } catch (error: any) {
    console.error('GA4 Final Exception:', error.message);

    // Catch-all for quota errors, network timeouts, or property access denied
    return NextResponse.json({
      error: error.message,
      ...getMockData(),
      isMock: true,
    });
  }
}

function getMockData() {
  const today = new Date();
  const daily = Array.from({ length: 28 }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - (27 - i)); // Last 28 days
    const users = Math.floor(Math.random() * 50) + 10;
    return {
      date: d.toISOString().split('T')[0].replace(/-/g, ''),
      users: users,
      newUsers: Math.floor(users * 0.4),
      sessions: Math.floor(users * 1.2),
      engagementDuration: Math.floor(users * 60),
    };
  });

  return {
    overview: {
      totalUsers: 1450,
      newUsers: 840,
      sessions: 2100,
      avgSessionDuration: 145.5,
      engagementRate: 0.65,
      bounceRate: 0.35,
    },
    realtime: [
      { device: 'mobile', country: 'India', city: 'New Delhi', users: 12 },
      { device: 'desktop', country: 'United States', city: 'New York', users: 8 },
      { device: 'tablet', country: 'United Kingdom', city: 'London', users: 2 },
    ],
    daily,
    topPages: [
      {
        title: 'Home',
        path: '/',
        views: 1250,
        users: 900,
        engagementDuration: 54000,
        engagementRate: 0.7,
      },
      {
        title: 'Products',
        path: '/products',
        views: 840,
        users: 600,
        engagementDuration: 42000,
        engagementRate: 0.65,
      },
      {
        title: 'About Us',
        path: '/about',
        views: 430,
        users: 300,
        engagementDuration: 15000,
        engagementRate: 0.5,
      },
      {
        title: 'Contact',
        path: '/contact',
        views: 210,
        users: 150,
        engagementDuration: 8000,
        engagementRate: 0.4,
      },
      {
        title: 'Blog',
        path: '/blog',
        views: 180,
        users: 120,
        engagementDuration: 12000,
        engagementRate: 0.6,
      },
    ],
    acquisition: [
      { source: 'google', medium: 'organic', sessions: 800, users: 600, engagementRate: 0.75 },
      { source: '(direct)', medium: '(none)', sessions: 400, users: 250, engagementRate: 0.6 },
      { source: 'linkedin', medium: 'referral', sessions: 150, users: 100, engagementRate: 0.8 },
    ],
    tech: [
      { browser: 'Chrome', os: 'Windows', device: 'desktop', resolution: '1920x1080', users: 500 },
      { browser: 'Safari', os: 'iOS', device: 'mobile', resolution: '390x844', users: 300 },
    ],
    geo: [
      { country: 'India', city: 'Mumbai', language: 'en-us', users: 400 },
      { country: 'United States', city: 'San Francisco', language: 'en-us', users: 200 },
    ],
    isMock: true,
  };
}
