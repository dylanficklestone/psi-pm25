/**
 * OneMap API Integration & Token Service
 * Reads the OneMap API token directly from ONEMAP_API in Vercel / environment variables.
 * Handles token sanitization, tile proxying, and fallback.
 */

let cachedToken = null;

export function sanitizeToken(raw) {
  if (!raw) return null;
  let token = raw.trim();
  // Strip outer quotes if accidentally pasted with quotes
  token = token.replace(/^["']|["']$/g, '').trim();
  // Strip Bearer prefix if accidentally included
  token = token.replace(/^Bearer\s+/i, '').trim();
  return token || null;
}

export async function getOneMapToken() {
  const envApi = process.env.ONEMAP_API;
  const sanitized = sanitizeToken(envApi);

  if (sanitized) {
    // Check if it was entered as JSON {"email": "...", "password": "..."}
    if (sanitized.startsWith('{')) {
      try {
        const parsed = JSON.parse(sanitized);
        if (parsed.email && parsed.password) {
          if (cachedToken) return cachedToken;
          const res = await fetch('https://www.onemap.gov.sg/api/auth/post/getToken', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: parsed.email, password: parsed.password }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.access_token) {
              cachedToken = data.access_token;
              return cachedToken;
            }
          }
        }
      } catch (err) {
        console.warn('Failed to parse JSON ONEMAP_API credentials:', err);
      }
    }

    // Direct token string
    return sanitized;
  }

  // Also check ONEMAP_EMAIL and ONEMAP_PASSWORD if present
  if (process.env.ONEMAP_EMAIL && process.env.ONEMAP_PASSWORD) {
    if (cachedToken) return cachedToken;
    try {
      const res = await fetch('https://www.onemap.gov.sg/api/auth/post/getToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: process.env.ONEMAP_EMAIL.trim(),
          password: process.env.ONEMAP_PASSWORD.trim(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.access_token) {
          cachedToken = data.access_token;
          return cachedToken;
        }
      }
    } catch (err) {
      console.warn('OneMap auto token fetch failed:', err);
    }
  }

  return null;
}

export async function handleTokenRequest(req, res) {
  const token = await getOneMapToken();
  const isConfigured = Boolean(process.env.ONEMAP_API || (process.env.ONEMAP_EMAIL && process.env.ONEMAP_PASSWORD));

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache');
  return res.json({
    configured: isConfigured,
    hasActiveToken: Boolean(token),
    token: token || null,
    provider: token ? 'onemap' : 'cartocdn_fallback',
    supportedStyles: ['Night', 'Default', 'Grey', 'Original'],
    message: token
      ? 'OneMap API token active'
      : 'OneMap API token pending. Add ONEMAP_API in Vercel environment variables.',
  });
}

export async function handleTileProxy(req, res) {
  // Support both Express req.params and Vercel req.query
  const params = req.customParams || req.params || {};
  const query = req.query || {};

  const style = params.style || query.style || 'Night';
  const z = params.z || query.z;
  const x = params.x || query.x;
  const y = params.y || query.y;

  if (!z || !x || !y) {
    return res.status(400).send('Missing tile coordinates (z, x, y)');
  }

  const token = await getOneMapToken();

  if (token) {
    // Attempt OneMap tile with Bearer token
    try {
      const oneMapUrl = `https://www.onemap.gov.sg/maps/service/styles/${style}/512/${z}/${x}/${y}.png`;
      const upstream = await fetch(oneMapUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'image/png,image/*',
        },
      });

      if (upstream.ok && upstream.headers.get('content-type')?.includes('image')) {
        const buffer = await upstream.arrayBuffer();
        res.setHeader('Content-Type', upstream.headers.get('content-type') || 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.setHeader('X-Tile-Provider', 'onemap');
        return res.send(Buffer.from(buffer));
      } else {
        console.warn(`OneMap returned HTTP ${upstream.status} for tile, using styled fallback.`);
      }
    } catch (err) {
      console.warn('Failed to fetch from OneMap tile service, using fallback...', err);
    }
  }

  // Graceful fallback to CartoDB dark/voyager tiles
  try {
    const isDark = style.toLowerCase() === 'night' || style.toLowerCase() === 'grey';
    const fallbackBase = isDark
      ? 'https://a.basemaps.cartocdn.com/rastertiles/dark_all'
      : 'https://a.basemaps.cartocdn.com/rastertiles/voyager';

    const fallbackUrl = `${fallbackBase}/${z}/${x}/${y}.png`;
    const fallbackRes = await fetch(fallbackUrl);

    if (fallbackRes.ok) {
      const buffer = await fallbackRes.arrayBuffer();
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('X-Tile-Provider', 'fallback');
      return res.send(Buffer.from(buffer));
    }
  } catch (err) {
    return res.status(502).json({ error: 'Tile fetch failed' });
  }

  return res.status(404).send('Tile not found');
}

// Default export compatible with Vercel Serverless Functions
export default async function onemapHandler(req, res) {
  const url = req.url || '';
  const query = req.query || {};

  // Check if it's a token request
  if (query.action === 'token' || url.includes('/token') || (!query.action && !url.includes('/tile'))) {
    return handleTokenRequest(req, res);
  }

  // Tile request
  if (query.action === 'tile' || url.includes('/tile')) {
    // If url contains /tile/:style/:z/:x/:y
    const tileMatch = url.match(/\/tile\/([^\/]+)\/([^\/]+)\/([^\/]+)\/([^\/]+)/);
    if (tileMatch) {
      req.customParams = {
        style: tileMatch[1],
        z: tileMatch[2],
        x: tileMatch[3],
        y: tileMatch[4].replace(/\.png$/, ''),
      };
    }
    return handleTileProxy(req, res);
  }

  return handleTokenRequest(req, res);
}
