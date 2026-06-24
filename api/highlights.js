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

   Mediacorp titles look like:
     "Panama 0-1 Croatia | Group L | FIFA World Cup 2026™ Highlights"
   so we parse the two team names out of the title and only
   return a video when BOTH names match the requested match —
   otherwise we return no video (the UI shows its fallback)
   rather than a wrong clip.

   On success: { videoId, title }
   On any failure: { videoId: null, reason, detail? } with a 200.
   Hit this endpoint directly (e.g. /api/highlights?a=Panama&b=Croatia)
   to inspect the reason / matched title.
   ============================================================ */

// Mediacorp Sports — youtube.com/channel/UCCc3h5l7RvGzCAbZ1ApxOYw
const CHANNEL_ID = 'UCCc3h5l7RvGzCAbZ1ApxOYw';

// Words that are never part of a team name — ignored in token matching.
const STOP = new Set([
  'fifa', 'world', 'cup', 'highlights', 'highlight', 'group', 'match', 'final',
  'finals', 'round', 'quarter', 'quarterfinal', 'semi', 'semifinal', 'women',
  'womens', 'mens', 'football', 'soccer', 'full', 'extended', 'and', 'the',
]);

// Teams our data spells differently from Mediacorp / broadcast convention.
const ALIAS_GROUPS = [
  ['turkiye', 'turkey'],
  ['unitedstates', 'usa', 'us', 'unitedstatesofamerica'],
  ['cotedivoire', 'ivorycoast'],
  ['caboverde', 'capeverde'],
  ['czechia', 'czechrepublic'],
  ['southkorea', 'korearepublic', 'republicofkorea'],
  ['northkorea', 'koreadpr', 'dprkorea'],
  ['drcongo', 'congodr', 'democraticrepublicofcongo'],
  ['bosniaherz', 'bosniaandherzegovina', 'bosniaherzegovina'],
  ['iran', 'iriran'],
].map((g) => new Set(g));

// "Côte d'Ivoire" -> "cotedivoire"  (letters only, accents stripped)
const norm = (s) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');

// significant words (>= 4 letters, not stop-words)
const tokens = (s) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z]+/g, ' ').split(' ')
    .filter((w) => w.length >= 4 && !STOP.has(w));

// Do two team names (possibly spelt differently) refer to the same team?
function sameTeam(x, y) {
  const nx = norm(x), ny = norm(y);
  if (!nx || !ny) return false;
  if (nx === ny) return true;
  if (nx.length >= 4 && ny.length >= 4 && (nx.includes(ny) || ny.includes(nx))) return true;
  if (ALIAS_GROUPS.some((g) => g.has(nx) && g.has(ny))) return true;
  const tx = tokens(x), ty = tokens(y);
  return tx.some((t) => ty.includes(t));
}

// Pull the two team names out of a Mediacorp title.
// "Panama 0-1 Croatia | Group L | …"  ->  ["Panama", "Croatia"]
// "Spain 1-1 (4-2) Italy | …"          ->  ["Spain", "Italy"]
function extractTeams(title) {
  const head = String(title || '').split('|')[0];
  let parts = head
    .split(/\s*\d+\s*[-–—]\s*\d+\s*/)            // split on score(s)
    .map((s) => s.replace(/[()]/g, ' ').trim())
    .filter(Boolean);
  if (parts.length >= 2) return [parts[0], parts[parts.length - 1]];
  parts = head.split(/\s+vs?\.?\s+/i).map((s) => s.trim()).filter(Boolean); // "A vs B"
  if (parts.length >= 2) return [parts[0], parts[parts.length - 1]];
  return null;
}

// Does this title's pair match our requested pair (either home/away order)?
function titleMatchesPair(title, a, b) {
  const ts = extractTeams(title);
  if (!ts) return false;
  const [eA, eB] = ts;
  return (sameTeam(eA, a) && sameTeam(eB, b)) || (sameTeam(eA, b) && sameTeam(eB, a));
}

// Exported for unit testing; the Vercel runtime only uses the default export.
export { sameTeam, extractTeams, titleMatchesPair };

export default async function handler(req, res) {
  const a = (req.query?.a || '').toString().trim();
  const b = (req.query?.b || '').toString().trim();
  const key = process.env.YOUTUBE_API_KEY;

  // Highlights for a finished match never change, so cache hard at the edge.
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');

  if (!key) return res.status(200).json({ videoId: null, reason: 'no-key' });
  if (!a || !b) return res.status(200).json({ videoId: null, reason: 'bad-request' });

  // A search costs the same quota at any maxResults, so pull a batch and match
  // by title rather than trusting relevance order.
  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('channelId', CHANNEL_ID);
  url.searchParams.set('q', `${a} ${b} FIFA World Cup 2026 Highlights`);
  url.searchParams.set('type', 'video');
  url.searchParams.set('videoEmbeddable', 'true');
  url.searchParams.set('maxResults', '12');
  url.searchParams.set('order', 'relevance');
  url.searchParams.set('key', key);

  try {
    const r = await fetch(url);
    const data = await r.json().catch(() => null);

    if (!r.ok) {
      const detail = data?.error?.message || `http-${r.status}`;
      return res.status(200).json({ videoId: null, reason: `yt-${r.status}`, detail });
    }

    const items = (data?.items || []).filter((it) => it?.id?.videoId);
    if (items.length === 0) {
      return res.status(200).json({ videoId: null, reason: 'no-results' });
    }

    // Only accept a video whose title actually names BOTH teams. No relevance
    // fallback — a wrong video is worse than none.
    const pick = items.find((it) => titleMatchesPair(it.snippet?.title, a, b));

    if (!pick) {
      return res.status(200).json({
        videoId: null,
        reason: 'no-match',
        detail: items.slice(0, 8).map((it) => it.snippet?.title).filter(Boolean),
      });
    }

    return res.status(200).json({ videoId: pick.id.videoId, title: pick.snippet?.title || null });
  } catch (err) {
    return res.status(200).json({ videoId: null, reason: 'fetch-failed', detail: String(err?.message || err) });
  }
}
