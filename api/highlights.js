/* ============================================================
   WC2026 — Match highlights lookup (Vercel serverless function)

   Searches Mediacorp Sports' YouTube channel (Singapore's
   official WC2026 broadcaster) for a match's highlights and
   returns a single embeddable videoId. The YouTube Data API v3
   key is held server-side here so it never ships to the browser
   — set it in your Vercel project as the YOUTUBE_API_KEY
   environment variable.

   We use Mediacorp rather than FIFA's own channel because FIFA
   content-blocks third-party embedding ("This video contains
   content from FIFA, who has blocked it…"), so FIFA clips can
   never play in our iframe. Mediacorp uploads its own highlights
   and allows embedding.

   On success: { videoId, title }
   On any failure: { videoId: null, reason, detail? } with a 200
   so the frontend can simply show its fallback. The `reason`
   field is for debugging — hit this endpoint directly in a
   browser (e.g. /api/highlights?a=Spain&b=Germany) to see it.
   ============================================================ */

// Mediacorp Sports — youtube.com/channel/UCCc3h5l7RvGzCAbZ1ApxOYw
const CHANNEL_ID = 'UCCc3h5l7RvGzCAbZ1ApxOYw';

export default async function handler(req, res) {
  const a = (req.query?.a || '').toString().trim();
  const b = (req.query?.b || '').toString().trim();
  const key = process.env.YOUTUBE_API_KEY;

  // Highlights for a finished match never change, so cache hard at the edge.
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');

  if (!key) return res.status(200).json({ videoId: null, reason: 'no-key' });
  if (!a || !b) return res.status(200).json({ videoId: null, reason: 'bad-request' });

  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('channelId', CHANNEL_ID);
  url.searchParams.set('q', `${a} vs ${b} highlights`);
  url.searchParams.set('type', 'video');
  url.searchParams.set('videoEmbeddable', 'true');
  url.searchParams.set('maxResults', '1');
  url.searchParams.set('order', 'relevance');
  url.searchParams.set('key', key);

  try {
    const r = await fetch(url);
    const data = await r.json().catch(() => null);

    if (!r.ok) {
      // Surface YouTube's own message (e.g. "API key not valid",
      // "requests from referer ... are blocked", "quota exceeded")
      // so the misconfiguration is obvious — without echoing the key.
      const detail = data?.error?.message || `http-${r.status}`;
      return res.status(200).json({ videoId: null, reason: `yt-${r.status}`, detail });
    }

    const item = data?.items?.[0];
    if (!item?.id?.videoId) {
      return res.status(200).json({ videoId: null, reason: 'no-results' });
    }
    return res.status(200).json({
      videoId: item.id.videoId,
      title: item.snippet?.title || null,
    });
  } catch (err) {
    return res.status(200).json({ videoId: null, reason: 'fetch-failed', detail: String(err?.message || err) });
  }
}
