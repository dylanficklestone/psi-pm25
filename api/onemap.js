/**
 * OneMap API Integration & Token Service
 * Handles OneMap token minting, caching, and tile proxy with fallback.
 */

let cachedToken = null;
let tokenExpiryTime = 0; // Epoch ms

export async function getOneMapToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiryTime - 60000) {
    return cachedToken;
  }

  const envApi = process.env.ONEMAP_API?.trim();
  const envEmail = process.env.ONEMAP_EMAIL?.trim();
  const envPassword = process.env.ONEMAP_PASSWORD?.trim();

  let email = null;
  let password = null;

  if (envApi) {
    if (envApi.startsWith('{')) {
      try {
        const parsed = JSON.parse(envApi);
        email = parsed.email;
        password = parsed.password;
      } catch (e) {
        console.error('Failed to parse ONEMAP_API JSON:', e);
      }
    } else {
      // Direct token string
      cachedToken = envApi;
      tokenExpiryTime = now + 3 * 24 * 3600 * 1000; // Assume 3 days
      return cachedToken;
    }
  }

  if (!email && envEmail) email = envEmail;
  if (!password && envPassword) password = envPassword;

  if (!email || !password) {
    return null;
  }

  try {
    const res = await fetch('https://www.onemap.gov.sg/api/auth/post/getToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      console.warn(`OneMap auth error ${res.status}: ${res.statusText}`);
      return null;
    }

    const data = await res.json();
    if (data.access_token) {
      cachedToken = data.access_token;
      // Lasts 3 days (259200 seconds)
      tokenExpiryTime = now + (data.expires_in ? data.expires_in * 1000 : 3 * 24 * 3600 * 1000);
      return cachedToken;
    }
  } catch (err) {
    console.error('OneMap token fetch failed:', err);
  }

  return null;
}

export async function handleTokenRequest(req, res) {
  const token = await getOneMapToken();
  const isConfigured = Boolean(
    process.env.ONEMAP_API || (process.env.ONEMAP_EMAIL && process.env.ONEMAP_PASSWORD)
  );

  res.setHeader('Content-Type', 'application/json');
  return res.json({
    configured: isConfigured,
    hasActiveToken: Boolean(token),
    token: token || null,
    provider: token ? 'onemap' : 'cartocdn_fallback',
    expiry: token ? tokenExpiryTime : null,
    supportedStyles: ['Night', 'Default', 'Grey', 'Original'],
    message: isConfigured
      ? 'OneMap API authentication configured'
      : 'OneMap API token pending. Add ONEMAP_API in environment variables. Using styled fallback tiles.',
  });
}

export async function handleTileProxy(req, res) {
  const { style = 'Night', z, x, y } = req.params;
  const token = await getOneMapToken();

  if (token) {
    // Attempt OneMap tile
    try {
      // OneMap v2 standard style endpoint
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
        return res.send(Buffer.from(buffer));
      }
    } catch (err) {
      console.warn('Failed to fetch from OneMap tile service, falling back...', err);
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
