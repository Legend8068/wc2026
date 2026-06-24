/* ============================================================
   WC2026 — Match highlights lookup (Vercel serverless function)

   Searches FIFA's official YouTube channel for a match's
   highlights and returns a single embeddable videoId. The
   YouTube Data API v3 key is held server-side here so it never
   ships to the browser — set it in your Vercel project as the
   YOUTUBE_API_KEY environment variable.

   Every failure path (no key, no result, upstream/network error)
   resolves to { videoId: null } with a 200 so the frontend can
   simply show its fallback instead of handling error codes.
   ============================================================ */

const FIFA_CHANNEL_ID = 'UCpcTrCXblq78GZrTUTLWeBw'; // FIFA official

export default async function handler(req, res) {
  const a = (req.query.a || '').toString().trim();
  const b = (req.query.b || '').toString().trim();
  const key = process.env.YOUTUBE_API_KEY;

  // Highlights for a finished match never change, so cache hard at the edge.
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');

  if (!key) return res.status(200).json({ videoId: null, reason: 'no-key' });
  if (!a || !b) return res.status(200).json({ videoId: null, reason: 'bad-request' });

  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('channelId', FIFA_CHANNEL_ID);
  url.searchParams.set('q', `${a} vs ${b} highlights`);
  url.searchParams.set('type', 'video');
  url.searchParams.set('videoEmbeddable', 'true');
  url.searchParams.set('maxResults', '1');
  url.searchParams.set('order', 'relevance');
  url.searchParams.set('key', key);

  try {
    const r = await fetch(url);
    if (!r.ok) return res.status(200).json({ videoId: null, reason: `yt-${r.status}` });
    const data = await r.json();
    const item = data.items && data.items[0];
    return res.status(200).json({
      videoId: item?.id?.videoId || null,
      title: item?.snippet?.title || null,
    });
  } catch {
    return res.status(200).json({ videoId: null, reason: 'fetch-failed' });
  }
}
