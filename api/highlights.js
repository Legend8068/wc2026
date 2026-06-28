/* ============================================================
   WC2026 — Match highlights lookup (Vercel serverless function)

   Searches the Mediacorp Sports YouTube channel for a match's
   highlights and returns a single embeddable videoId. The YouTube
   Data API v3 key is held server-side so it never ships to the
   browser — set it in your Vercel project as the YOUTUBE_API_KEY
   environment variable.

   Sourcing:
   • Mediacorp Sports (@SportsMediacorp) is the official
     Singapore broadcaster for FIFA World Cup 2026™. Their per-match
     highlight titles follow a consistent pattern, e.g.:
     "Jordan 1-3 Argentina | Group J | FIFA World Cup 2026™ Highlights"
   • We search ONLY this channel (channelId filter) to guarantee
     every result is from the official broadcaster.
   • Only return a video whose TITLE names BOTH teams (in either
     order) so we never surface a wrong match.

   On success: { videoId, title }
   On any failure: { videoId: null, reason, detail? } with a 200.
   Hit this endpoint directly (e.g. /api/highlights?a=Panama&b=Croatia)
   to inspect the reason / candidate titles.
   ============================================================ */

// Mediacorp Sports — official Singapore broadcaster for FIFA WC 2026
const MEDIACORP_CHANNEL_ID = 'UCMTqHyyQlprpDErBdIZ0OgU';

// Words that are never part of a team name — ignored in token matching.
const STOP = new Set([
  'fifa', 'world', 'cup', 'highlights', 'highlight', 'group', 'match', 'final',
  'finals', 'round', 'quarter', 'quarterfinal', 'semi', 'semifinal', 'women',
  'womens', 'mens', 'football', 'soccer', 'full', 'extended', 'and', 'the',
]);

// Teams our data spells differently from broadcast convention.
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
  (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');

// significant words (>= 4 letters, not stop-words)
const tokens = (s) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
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

// Pull the two team names out of a highlight title. Handles, across any
// "|"-separated segment:
//   "Panama 0-1 Croatia | Group L | …"   -> ["Panama", "Croatia"]
//   "Spain 1-1 (4-2) Italy | …"          -> ["Spain", "Italy"]
//   "… | Netherlands v Sweden | …"       -> ["Netherlands", "Sweden"]
function extractTeams(title) {
  const segs = String(title || '').split('|');
  for (const seg of segs) {
    const parts = seg
      .split(/\s*\d+\s*[-\u2013\u2014]\s*\d+\s*/)
      .map((s) => s.replace(/[()]/g, ' ').trim())
      .filter(Boolean);
    if (parts.length >= 2) return [parts[0], parts[parts.length - 1]];
  }
  for (const seg of segs) {
    const parts = seg.split(/\s+vs?\.?\s+/i).map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 2) return [parts[0], parts[parts.length - 1]];
  }
  return null;
}

// Is `ourName` present anywhere in the title (alias/token aware)?
function titleHasTeam(title, ourName) {
  const nt = norm(title);
  const variants = new Set([norm(ourName)]);
  for (const g of ALIAS_GROUPS) {
    if (g.has(norm(ourName))) for (const v of g) variants.add(v);
  }
  for (const v of variants) if (v.length >= 4 && nt.includes(v)) return true;
  const tt = tokens(title);
  return tokens(ourName).some((t) => tt.includes(t));
}

// Does this title belong to our match (both teams named, either order)?
function titleMatchesPair(title, a, b) {
  const ts = extractTeams(title);
  if (ts) {
    const [eA, eB] = ts;
    if ((sameTeam(eA, a) && sameTeam(eB, b)) || (sameTeam(eA, b) && sameTeam(eB, a))) return true;
  }
  // Looser net for odd title shapes: both teams named somewhere + "highlight".
  if (/highlight/i.test(title) && titleHasTeam(title, a) && titleHasTeam(title, b)) return true;
  return false;
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

  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('q', `${a} ${b} World Cup 2026 Highlights`);
  url.searchParams.set('type', 'video');
  url.searchParams.set('channelId', MEDIACORP_CHANNEL_ID);
  url.searchParams.set('videoEmbeddable', 'true');
  url.searchParams.set('maxResults', '10');
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
