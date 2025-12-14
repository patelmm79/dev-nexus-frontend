import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const BACKEND = process.env.BACKEND_URL || 'https://pattern-discovery-agent-665374072631.us-central1.run.app';
  const target = `${BACKEND}/health`;

  try {
    const response = await fetch(target, {
      method: req.method,
      // Forward common headers but avoid host header
      headers: Object.fromEntries(Object.entries(req.headers || {}).filter(([k]) => k.toLowerCase() !== 'host')),
      // Vercel provides body parsing; forward raw body for non-GET/HEAD
      body: ['GET', 'HEAD'].includes(req.method || '') ? undefined : req.body,
    });

    const body = await response.arrayBuffer();
    const buffer = Buffer.from(body);

    // Copy response headers we care about
    const contentType = response.headers.get('content-type');
    if (contentType) res.setHeader('content-type', contentType);
    const cacheControl = response.headers.get('cache-control');
    if (cacheControl) res.setHeader('cache-control', cacheControl);

    res.status(response.status).send(buffer);
  } catch (err: any) {
    res.status(502).json({ error: err?.message || String(err) });
  }
}
