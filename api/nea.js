/**
 * NEA API Proxy Serverless Handler for Vercel
 */

const NEA_BASE = 'https://api-open.data.gov.sg/v2/real-time/api';
const VALID_ENDPOINTS = new Set(['air-temperature', 'psi', 'pm25', 'relative-humidity']);

export default async function neaHandler(req, res) {
  const endpoint = req.query.endpoint;
  if (!VALID_ENDPOINTS.has(endpoint)) {
    return res.status(400).json({ error: 'Invalid NEA endpoint' });
  }

  try {
    const params = { ...req.query };
    delete params.endpoint;
    const queryString = new URLSearchParams(params).toString();
    const targetUrl = `${NEA_BASE}/${endpoint}${queryString ? `?${queryString}` : ''}`;

    const upstreamRes = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SG-Air-Monitor/1.0',
        Accept: 'application/json',
      },
    });

    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).json({
        error: `Upstream error: ${upstreamRes.statusText}`,
      });
    }

    const data = await upstreamRes.json();
    res.setHeader('Cache-Control', 'public, max-age=60');
    return res.json(data);
  } catch (err) {
    return res.status(502).json({
      error: 'Failed to communicate with NEA open data services',
      details: err instanceof Error ? err.message : String(err),
    });
  }
}
