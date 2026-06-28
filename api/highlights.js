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
     and sometimes without the score:
     "Panama vs England | Group L | FIFA World Cup 2026™ Highlights"
   • We read this channel's UPLOADS directly via playlistItems.list
     (not search.list). The Data API's in-channel `q` search is wildly
     incomplete — it returned 0–2 items for most matches and missed the
     actual highlight uploads — whereas the uploads playlist is complete,
     immediately available (no search-index lag) and ~100× cheaper on
     quota (1 unit/page vs 100/search). We scan newest-first and keep
     only a video that is a HIGHLIGHTS upload naming BOTH teams (score
     "X-Y" or "vs", either order); the "Highlights" requirement filters
     out the channel's analysis / reaction / interview clips.
   • Optional sa/sb (this match's final score) are used as a tiebreaker
     so a repeat matchup (group + knockout) returns the correct leg.

   On success: { videoId, title }
   On any failure: { videoId: null, reason, detail? } with a 200.
   Hit this endpoint directly (e.g. /api/highlights?a=Panama&b=Croatia)
   to inspect the reason / candidate titles.
   ============================================================ */

// Mediacorp Sports — official Singapore broadcaster for FIFA WC 2026.
// Channel ID resolved from the canonical URL of youtube.com/@SportsMediacorp.
const MEDIACORP_CHANNEL_ID = 'UCCc3h5l7RvGzCAbZ1ApxOYw';
// A channel's uploads playlist is its ID with the "UC" prefix swapped for "UU".
const MEDIACORP_UPLOADS = `UU${MEDIACORP_CHANNEL_ID.slice(2)}`;
// How many 50-video pages of uploads to scan before giving up. The channel
// posts several clips per match day, so this comfortably covers recent matches
// while bounding latency/quota when a match has no highlight upload yet.
const MAX_UPLOAD_PAGES = 10;

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

// Pull the two team names — and the main score, when present — out of a
// highlight title. Scans each "|"-separated segment and handles:
//   "Panama 0-1 Croatia | Group L | …"   -> { teams:["Panama","Croatia"], goals:[0,1] }
//   "Spain 1-1 (4-2) Italy | …"          -> { teams:["Spain","Italy"], goals:[1,1] }
//   "Panama vs England | Group L | …"    -> { teams:["Panama","England"], goals:null }
//   "… | Netherlands v Sweden | …"       -> { teams:["Netherlands","Sweden"], goals:null }
// The first "X-Y" in a segment is the regulation/ET result; a trailing
// shootout score in parens ("(4-2)") is ignored for the goals reading.
const SCORE_SPLIT = /\s*\d+\s*[-\u2013\u2014]\s*\d+\s*/;
const SCORE_FIND = /(\d+)\s*[-\u2013\u2014]\s*(\d+)/;
function extractMatch(title) {
  const segs = String(title || '').split('|');
  for (const seg of segs) {
    const m = seg.match(SCORE_FIND);
    if (!m) continue;
    const parts = seg
      .split(SCORE_SPLIT)
      .map((s) => s.replace(/[()]/g, ' ').trim())
      .filter(Boolean);
    if (parts.length >= 2) {
      return { teams: [parts[0], parts[parts.length - 1]], goals: [Number(m[1]), Number(m[2])] };
    }
  }
  for (const seg of segs) {
    const parts = seg.split(/\s+vs?\.?\s+/i).map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 2) return { teams: [parts[0], parts[parts.length - 1]], goals: null };
  }
  return null;
}

function extractTeams(title) {
  const m = extractMatch(title);
  return m ? m.teams : null;
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

// Does this title belong to our match? Requires it to be a HIGHLIGHTS video
// (so the channel's analysis / reaction / interview clips never qualify) AND
// to name both teams in either order — via the structured "X-Y"/"vs" reading
// first, then a looser token net for odd shapes.
function titleMatchesPair(title, a, b) {
  if (!/highlights?/i.test(title)) return false;
  const ts = extractTeams(title);
  if (ts) {
    const [eA, eB] = ts;
    if ((sameTeam(eA, a) && sameTeam(eB, b)) || (sameTeam(eA, b) && sameTeam(eB, a))) return true;
  }
  // Looser net for odd title shapes: both teams named somewhere.
  if (titleHasTeam(title, a) && titleHasTeam(title, b)) return true;
  return false;
}

// If the title carries a score, return it oriented to our (a, b) team order —
// [goalsA, goalsB] — else null. Used only as a tiebreaker between candidates.
function titleScoreFor(title, a, b) {
  const m = extractMatch(title);
  if (!m || !m.goals) return null;
  const [eA, eB] = m.teams;
  const [gx, gy] = m.goals;
  if (sameTeam(eA, a) && sameTeam(eB, b)) return [gx, gy];
  if (sameTeam(eA, b) && sameTeam(eB, a)) return [gy, gx];
  return null;
}

// Exported for unit testing; the Vercel runtime only uses the default export.
export { sameTeam, extractTeams, extractMatch, titleMatchesPair, titleScoreFor };

export default async function handler(req, res) {
  const a = (req.query?.a || '').toString().trim();
  const b = (req.query?.b || '').toString().trim();
  // Optional final score (digits only) — a tiebreaker for repeat matchups.
  const saRaw = (req.query?.sa ?? '').toString().trim();
  const sbRaw = (req.query?.sb ?? '').toString().trim();
  const wantScore = /^\d+$/.test(saRaw) && /^\d+$/.test(sbRaw)
    ? [Number(saRaw), Number(sbRaw)]
    : null;
  const key = process.env.YOUTUBE_API_KEY;

  // Highlights for a finished match never change, so cache hard at the edge.
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');

  if (!key) return res.status(200).json({ videoId: null, reason: 'no-key' });
  if (!a || !b) return res.status(200).json({ videoId: null, reason: 'bad-request' });

  try {
    // Scan the channel's uploads playlist newest-first. `fallback` holds the
    // newest highlights video that names both teams; if the match has a known
    // score we keep scanning for the leg whose title score matches exactly
    // (a group game vs a later rematch) and only fall back when none does.
    let fallback = null;
    const sampleTitles = []; // highlight titles seen, for no-match debugging
    let pageToken = '';
    let scanned = 0;

    for (let page = 0; page < MAX_UPLOAD_PAGES; page++) {
      const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
      url.searchParams.set('part', 'snippet');
      url.searchParams.set('playlistId', MEDIACORP_UPLOADS);
      url.searchParams.set('maxResults', '50');
      if (pageToken) url.searchParams.set('pageToken', pageToken);
      url.searchParams.set('key', key);

      const r = await fetch(url);
      const data = await r.json().catch(() => null);
      if (!r.ok) {
        const detail = data?.error?.message || `http-${r.status}`;
        return res.status(200).json({ videoId: null, reason: `yt-${r.status}`, detail });
      }

      for (const it of data?.items || []) {
        const title = it?.snippet?.title || '';
        const videoId = it?.snippet?.resourceId?.videoId;
        // Skip private/deleted placeholders (no playable videoId).
        if (!videoId || title === 'Private video' || title === 'Deleted video') continue;
        scanned++;
        if (sampleTitles.length < 8 && /highlights?/i.test(title)) sampleTitles.push(title);
        if (!titleMatchesPair(title, a, b)) continue;

        if (wantScore) {
          const s = titleScoreFor(title, a, b);
          if (s && s[0] === wantScore[0] && s[1] === wantScore[1]) {
            return res.status(200).json({ videoId, title }); // exact leg — done
          }
          if (!fallback) fallback = { videoId, title }; // remember newest match
        } else {
          return res.status(200).json({ videoId, title }); // newest match — done
        }
      }

      pageToken = data?.nextPageToken || '';
      if (!pageToken) break;
    }

    if (fallback) return res.status(200).json(fallback);
    return res.status(200).json({ videoId: null, reason: 'no-match', detail: { scanned, sampleTitles } });
  } catch (err) {
    return res.status(200).json({ videoId: null, reason: 'fetch-failed', detail: String(err?.message || err) });
  }
}
