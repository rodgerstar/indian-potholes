import { google } from 'googleapis';

const propertyId = process.env.GA_PROPERTY_ID;
const clientEmail = process.env.GA_CLIENT_EMAIL;
const privateKey = process.env.GA_PRIVATE_KEY.replace(/\\n/g, '\n');

const auth = new google.auth.JWT({
  email: clientEmail,
  key: privateKey,
  scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
});

const analyticsdata = google.analyticsdata({
  version: 'v1beta',
  auth,
});

export async function getTrafficOverview(days = 30) {
  const dateRange = [{ startDate: `${days}daysAgo`, endDate: 'today' }];

  // 1. Total Page Views
  const pageViewsRes = await analyticsdata.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: dateRange,
      metrics: [{ name: 'screenPageViews' }],
    },
  });
  const totalPageViews = pageViewsRes.data.rows?.[0]?.metricValues?.[0]?.value || '0';

  // 2. Top Pages
  const topPagesRes = await analyticsdata.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: dateRange,
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 10,
    },
  });
  const topPages = (topPagesRes.data.rows || []).map(row => ({
    pagePath: row.dimensionValues[0].value,
    pageViews: row.metricValues[0].value,
  }));

  // 3. Traffic Sources
  const sourcesRes = await analyticsdata.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: dateRange,
      dimensions: [{ name: 'sessionSourceMedium' }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 10,
    },
  });
  const trafficSources = (sourcesRes.data.rows || []).map(row => ({
    sourceMedium: row.dimensionValues[0].value,
    sessions: row.metricValues[0].value,
  }));

  // 4. Device Category Breakdown
  const deviceRes = await analyticsdata.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: dateRange,
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    },
  });
  const deviceBreakdown = (deviceRes.data.rows || []).map(row => ({
    device: row.dimensionValues[0].value,
    sessions: row.metricValues[0].value,
  }));

  // 5. Platform (Operating System) Breakdown
  const platformRes = await analyticsdata.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: dateRange,
      dimensions: [{ name: 'operatingSystem' }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 7,
    },
  });
  const platformBreakdown = (platformRes.data.rows || []).map(row => ({
    platform: row.dimensionValues[0].value,
    sessions: row.metricValues[0].value,
  }));

  return {
    totalPageViews,
    topPages,
    trafficSources,
    deviceBreakdown,
    platformBreakdown,
  };
} 