import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import D from '../data';
import { lineups, applySimBadges, venueFor } from '../engine';
import { fetchLineup } from '../live';
import RevealSection from './RevealSection';
import BrandText from './BrandText';
import VisualLineup from './VisualLineup';
import LottieComp from 'lottie-react';
import balancingFootball from '../assets/balancing-football.json';

const Lottie = LottieComp.default || LottieComp;

const PenGoal = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,200,83,0.3))', display: 'inline-block', verticalAlign: 'middle' }}>
    <circle cx="12" cy="12" r="10" fill="var(--green, #00c853)" />
    <path d="M7 12.5L10 15.5L17 8.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PenMiss = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ filter: 'drop-shadow(0 2px 4px rgba(226,0,26,0.3))', display: 'inline-block', verticalAlign: 'middle' }}>
    <circle cx="12" cy="12" r="10" fill="var(--red, #e2001a)" />
    <path d="M8 8L16 16M16 8L8 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

function ScoreDisplay({ value }) {
  const [pop, setPop] = useState(false);
  const prevVal = useRef(value);

  useEffect(() => {
    if (value !== prevVal.current && value !== null && prevVal.current !== null) {
      setPop(true);
      const t = setTimeout(() => setPop(false), 700);
      prevVal.current = value;
      return () => clearTimeout(t);
    }
    prevVal.current = value;
  }, [value]);

  return <span className={pop ? 'pop' : ''}>{value !== null ? value : ''}</span>;
}

function getEventIcon(ev) {
  if (ev.type === 'goal') {
    if (ev.ownGoal) return '⚽ (OG)';
    if (ev.penalty) return '⚽ (P)';
    return '⚽';
  }
  if (ev.type === 'yellow') return '🟨';
  if (ev.type === 'red') return '🟥';
  return '•';
}

function renderStatBar(name, valA, valB, suffix = '') {
  const nA = parseFloat(valA) || 0;
  const nB = parseFloat(valB) || 0;
  const total = nA + nB;
  const pctA = total > 0 ? (nA / total) * 100 : 50;
  const pctB = 100 - pctA;

  return (
    <div className="mc-stat-bar-item" key={name}>
      <div className="mc-stat-bar-labels">
        <span className="mc-stat-val-left">{valA ?? 0}{suffix}</span>
        <span className="mc-stat-name">{name}</span>
        <span className="mc-stat-val-right">{valB ?? 0}{suffix}</span>
      </div>
      <div className="mc-stat-bar-track">
        <div className="mc-stat-bar-fill home" style={{ width: `${pctA}%` }} />
        <div className="mc-stat-bar-fill away" style={{ width: `${pctB}%` }} />
      </div>
    </div>
  );
}

function LineupColumn({ side, teamName, flag, data }) {
  return (
    <div className={`mc-xi-col ${side}`}>
      <div className="mc-form-head">
        <img className="mc-form-flag" src={flag} alt="" />
        <span className="mc-form-team">{teamName}</span>
        <span className="mc-form-badge">{data.formation}</span>
      </div>
      <ul className="mc-xi">
        {data.xi.map((p, i) => (
          <li className="mc-player-row" key={i}>
            <span className="mc-shirt">{p.num}</span>
            <span className="mc-pname">{p.name}</span>
            <span className={`mc-pos-tag pos-${p.pos}`}>{p.pos}</span>
          </li>
        ))}
      </ul>
      <div className="mc-subs-head">SUBSTITUTES</div>
      <ul className="mc-subs">
        {data.subs.map((p, i) => (
          <li className="mc-sub-row" key={i}>
            <span className="mc-shirt sub">{p.num}</span>
            <span className="mc-pname">{p.name}</span>
            <span className={`mc-pos-tag pos-${p.pos}`}>{p.pos}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Resolve a fixture id back to its { id, a, b } (group fixture, or a knockout
// match whose slots have been filled in the current snapshot).
function findFixture(snapshot, id) {
  const g = D.GROUP_FIXTURES.find(f => f.id === id);
  if (g) return g;
  const m = D.KO.find(k => k.id === id);
  if (m) {
    const t = snapshot?.teams?.[id];
    if (t && t[0] && t[1]) return { id, a: t[0], b: t[1] };
  }
  return null;
}

const MatchCentre = React.memo(function MatchCentre({ snapshot }) {
  // null until the user picks; falls back to the first non-empty tab below.
  const [tab, setTab] = useState(null);
  const [expandedMatchId, setExpandedMatchId] = useState(null);
  // Real ESPN line-ups, lazily fetched when a card is expanded: fxId -> { eid, status, lu }
  const [lineupCache, setLineupCache] = useState({});
  const [viewPens, setViewPens] = useState(false);

  // Preserve the horizontal scroll position of the strip across expand/collapse:
  // expanding filters the strip down to one card (scroll resets), so we remember
  // where the user was and restore it when they hide the stats again.
  const stripRef = useRef(null);
  const savedScrollRef = useRef(0);
  const restorePendingRef = useRef(false);

  useLayoutEffect(() => {
    if (!expandedMatchId && restorePendingRef.current && stripRef.current) {
      stripRef.current.scrollLeft = savedScrollRef.current;
      restorePendingRef.current = false;
    }
  }, [expandedMatchId]);

  // Deps kept primitive so this only re-runs when the open match (or its
  // status) changes — not on every 500 ms render tick.
  const expSt = snapshot?.states?.[expandedMatchId];
  const expEid = expSt?.eid;
  const expStatus = expSt?.status;
  useEffect(() => {
    if (!expandedMatchId || !expEid) return;          // sim-only / unmapped → keep sim line-up
    const fx = findFixture(snapshot, expandedMatchId);
    if (!fx) return;
    let cancelled = false;
    fetchLineup(expEid, fx.a, fx.b, expSt.isoDate, expSt)
      .then(lu => {
        if (!cancelled && lu) {
          setLineupCache(prev => ({ ...prev, [expandedMatchId]: { eid: expEid, status: expStatus, lu } }));
        }
      })
      .catch(err => console.warn('lineup fetch failed', err));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedMatchId, expEid, expStatus]);

  if (!snapshot) return null;

  const { states, teams, now } = snapshot;

  // Gather all playable fixtures (group stage + resolved knockout matches)
  const allPlayable = [];
  D.GROUP_FIXTURES.forEach(fx => {
    allPlayable.push({ fx, label: `GROUP ${fx.group}` });
  });
  D.KO.forEach(m => {
    const t = teams[m.id];
    if (t && t[0] && t[1]) {
      allPlayable.push({
        fx: { id: m.id, a: t[0], b: t[1], d: m.d, t: m.t, ts: m.ts },
        label: m.id
      });
    }
  });

  // Filter based on active, recent and upcoming categories
  const activeMatches = allPlayable.filter(i => {
    const st = states[i.fx.id];
    return st && (st.status === 'live' || st.status === 'ht');
  });

  const recentMatches = allPlayable
    .filter(i => {
      const st = states[i.fx.id];
      return st && st.status === 'ft';
    })
    .sort((a, b) => b.fx.ts - a.fx.ts); // newest completed matches first

  const upcomingMatches = allPlayable
    .filter(i => {
      const st = states[i.fx.id];
      return st && st.status === 'pre';
    })
    .sort((a, b) => a.fx.ts - b.fx.ts); // soonest upcoming matches first

  // Three independent tabs. Default to the first one that actually has matches
  // (live → recent → upcoming) until the user explicitly picks one.
  const defaultTab = activeMatches.length ? 'live' : recentMatches.length ? 'recent' : 'upcoming';
  const effTab = tab || defaultTab;

  const byTab = { live: activeMatches, recent: recentMatches, upcoming: upcomingMatches };
  const cards = byTab[effTab] || [];
  const cardsToRender = expandedMatchId 
    ? cards.filter(c => c.fx.id === expandedMatchId)
    : cards;

  const TABS = [
    { id: 'live', label: activeMatches.length ? `LIVE (${activeMatches.length})` : 'LIVE' },
    { id: 'recent', label: 'RECENT' },
    { id: 'upcoming', label: 'UPCOMING' },
  ];

  const emptyMsg = {
    live: 'NO LIVE MATCHES AT THE MOMENT',
    recent: 'NO COMPLETED MATCHES YET',
    upcoming: 'NO UPCOMING MATCHES — TOURNAMENT COMPLETE',
  };

  const toggleExpand = (matchId) => {
    setExpandedMatchId(prev => {
      if (prev === matchId) {
        // Collapsing — restore the saved scroll once the full list re-renders.
        restorePendingRef.current = true;
        return null;
      }
      // Expanding — remember where the user was in the horizontal list.
      if (stripRef.current) savedScrollRef.current = stripRef.current.scrollLeft;
      setViewPens(false);
      return matchId;
    });
  };

  const renderCard = ({ fx, label }) => {
    const st = states[fx.id];
    if (!st) return null;

    const isLive = st.status === 'live' || st.status === 'ht';
    const isFt = st.status === 'ft';
    const canExpand = isLive || isFt;
    const isExpanded = expandedMatchId === fx.id;

    const minTxt = isLive
      ? (st.status === 'ht' ? 'HT' : `${st.clockText || st.minute}′ LIVE`)
      : isFt ? 'FULL TIME' : `${fx.d} · ${fx.t} SGT`;

    const minCls = isLive ? '' : isFt ? ' ft' : ' pre';

    const teamA = D.TEAMS[fx.a];
    const teamB = D.TEAMS[fx.b];
    if (!teamA || !teamB) return null;

    const venue = venueFor(fx.id);

    // Prefer the real ESPN line-up (lazily fetched on expand, already badged);
    // until it arrives — or for sim/unmapped matches — show the deterministic
    // simulated line-up so there's always something to render.
    const cached = lineupCache[fx.id];
    const espnLu = cached && cached.eid === st.eid ? cached.lu : null;
    const lu = (canExpand && isExpanded)
      ? (espnLu || applySimBadges(lineups(fx.id, fx.a, fx.b), fx, st))
      : null;

    // Which XI to show: the second-half line-up once the second half is under
    // way (and at full time); the first-half XI before then and during the break.
    const half = (st.status === 'ft' || (st.status === 'live' && st.minute > 45)) ? 2 : 1;

    return (
      <div
        className={`live-card ${isLive ? 'is-live' : ''} ${canExpand ? 'clickable' : ''} ${isExpanded ? 'is-expanded' : ''}`}
        key={fx.id}
        onClick={canExpand ? () => toggleExpand(fx.id) : undefined}
      >
        <div className="lc-visuals">
          <div className="lcv-panel lcv-home">
            <div className="lcv-flag-wrap">
              <img className="lcv-flag" src={D.flag(fx.a)} alt={teamA.name} />
            </div>
            <div className="lcv-name-bar">{teamA.name}</div>
          </div>

          <div className="lcv-center">
            <div className="lcv-venue" title={`${venue.stadium}, ${venue.city}`}>
              <span className="lcv-venue-city">{venue.city}</span>
              <span className="lcv-venue-stadium">{venue.stadium}</span>
            </div>
            <div className="lcv-score-box">
              {st.sa === null ? (
                <span className="lcv-vs">VS</span>
              ) : (
                <>
                  <div className="lcv-score-col">
                    <ScoreDisplay value={st.sa} />
                    {st.pensA !== undefined && st.pensA !== null && (st.pensA > 0 || st.pensB > 0) && (
                      <span className="pens">({st.pensA})</span>
                    )}
                  </div>
                  <span className="lcv-colon">-</span>
                  <div className="lcv-score-col">
                    <ScoreDisplay value={st.sb} />
                    {st.pensB !== undefined && st.pensB !== null && (st.pensA > 0 || st.pensB > 0) && (
                      <span className="pens">({st.pensB})</span>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="lcv-info-box">
              <div className="lcv-label">{label}</div>
              <div className={`lcv-time${minCls}`}>
                {isLive && <span className="lcv-live-dot" />}
                {minTxt}
              </div>
            </div>
          </div>

          <div className="lcv-panel lcv-away">
            <div className="lcv-flag-wrap">
              <img className="lcv-flag" src={D.flag(fx.b)} alt={teamB.name} />
            </div>
            <div className="lcv-name-bar">{teamB.name}</div>
          </div>
        </div>

        {canExpand && (
          <div className="lc-expand-btn">
            {isExpanded ? 'HIDE STATS ▲' : 'SHOW STATS ▼'}
          </div>
        )}

        {canExpand && isExpanded && (
          <div className="lc-details-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="lc-drawer-left">
              {/* Timeline Section */}
              <div className="mc-timeline-section">
                {(st.pensA > 0 || st.pensB > 0) ? (
                  <div className="mc-shootout-tabs">
                    <button className={`mc-shootout-tab ${!viewPens ? 'active' : ''}`} onClick={() => setViewPens(false)}>MATCH EVENTS</button>
                    <button className={`mc-shootout-tab ${viewPens ? 'active' : ''}`} onClick={() => setViewPens(true)}>PENALTIES</button>
                  </div>
                ) : (
                  <div className="mc-details-header">MATCH EVENTS</div>
                )}
                
                {viewPens && (st.pensA > 0 || st.pensB > 0) ? (
                  <div className="mc-shootout">
                    <div className="so-header">
                      <div className="so-col">{teamA.name}</div>
                      <div className="so-col">ROUND</div>
                      <div className="so-col">{teamB.name}</div>
                    </div>
                    {getShootoutSequence(fx.id, st.pensA, st.pensB).map((r, i) => (
                      <div className="so-row" key={i}>
                        <div className="so-res">{r.a ? <PenGoal /> : <PenMiss />}</div>
                        <div className="so-rnd">{i + 1}</div>
                        <div className="so-res">{r.b !== undefined ? (r.b ? <PenGoal /> : <PenMiss />) : ''}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    {!st.details || st.details.length === 0 ? (
                      <div className="mc-no-events">No match events reported yet.</div>
                    ) : (
                      <div className="mc-timeline">
                        {st.details.map((ev, idx) => {
                          const isHome = ev.isHome;
                          return (
                            <div className={`mc-timeline-row ${isHome ? 'home-event' : 'away-event'}`} key={idx}>
                              <div className="mc-timeline-left">
                                {isHome && (
                                  <div className="mc-event-wrapper">
                                    <div className="mc-event-content">
                                      <span className="mc-player-name">{ev.player}</span>
                                      <span className="mc-event-icon" title={ev.typeText}>{getEventIcon(ev)}</span>
                                    </div>
                                    {ev.assist && (
                                      <div className="mc-event-assist">
                                        👟 {ev.assist}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="mc-timeline-middle">{ev.clock}</div>
                              <div className="mc-timeline-right">
                                {!isHome && (
                                  <div className="mc-event-wrapper">
                                    <div className="mc-event-content">
                                      <span className="mc-event-icon" title={ev.typeText}>{getEventIcon(ev)}</span>
                                      <span className="mc-player-name">{ev.player}</span>
                                    </div>
                                    {ev.assist && (
                                      <div className="mc-event-assist">
                                        👟 {ev.assist}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Statistics Section */}
              <div className="mc-stats-section">
              <div className="mc-details-header">STATISTICS</div>
              <div className="mc-stats-list">
                {renderStatBar("Possession", st.statsHome?.possessionPct, st.statsAway?.possessionPct, "%")}
                {renderStatBar("Total Shots", st.statsHome?.totalShots, st.statsAway?.totalShots)}
                {renderStatBar("Shots on Target", st.statsHome?.shotsOnTarget, st.statsAway?.shotsOnTarget)}
                {renderStatBar("Fouls Committed", st.statsHome?.foulsCommitted, st.statsAway?.foulsCommitted)}
                {renderStatBar("Won Corners", st.statsHome?.wonCorners, st.statsAway?.wonCorners)}
              </div>
              </div>
            </div>
            {/* End of lc-drawer-left */}

            {/* Line-ups Section */}
            {lu && (
              <div className="lc-drawer-right mc-lineups-section">
                <div className="mc-details-header">LINE-UPS</div>
                <VisualLineup
                  home={lu.home}
                  away={lu.away}
                  teamA={teamA}
                  teamB={teamB}
                  flagA={D.flag(fx.a)}
                  flagB={D.flag(fx.b)}
                  half={half}
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <RevealSection id="live">
      <div className="rule-head">
        <div className="rule l"></div>
        <BrandText text="MATCH CENTRE" className="section-brand-header" />
        <div className="rule r"></div>
      </div>

      <div className="mc-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`mc-tab-btn ${effTab === t.id ? 'active' : ''} ${t.id === 'live' && activeMatches.length ? 'is-live-tab' : ''}`}
            onClick={() => { setTab(t.id); setExpandedMatchId(null); }}
          >
            {t.id === 'live' && activeMatches.length > 0 && <span className="mc-tab-dot" />}
            {t.label}
          </button>
        ))}
      </div>

      {cards.length === 0 && (
        <div className="live-empty">
          <div className="live-empty-text">{emptyMsg[effTab]}</div>
          {effTab === 'live' && (
            <div className="live-empty-anim">
              <Lottie animationData={balancingFootball} loop autoplay style={{ width: 180, height: 180 }} />
            </div>
          )}
        </div>
      )}

      <div className={`live-strip ${effTab === 'live' ? 'is-live-strip' : ''}`} id="live-strip" ref={stripRef}>
        {cardsToRender.map(renderCard)}
      </div>
    </RevealSection>
  );
});

export default MatchCentre;

function getShootoutSequence(fxId, pensA, pensB) {
  pensA = pensA || 0;
  pensB = pensB || 0;
  const rounds = Math.max(5, pensA, pensB);
  const getArr = (goals) => {
    const a = Array(goals).fill(true);
    while (a.length < rounds) a.push(false);
    return a;
  };
  const arrA = getArr(pensA);
  const arrB = getArr(pensB);
  
  let h = 0; 
  if (fxId) {
    for (let i = 0; i < fxId.length; i++) h += fxId.charCodeAt(i);
  }
  const shuf = (arr, seed) => {
    let s = seed;
    for (let i = arr.length - 1; i > 0; i--) {
      s = (s * 16807) % 2147483647;
      const j = s % (i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  };
  shuf(arrA, h);
  shuf(arrB, h + 1);

  return Array.from({length: rounds}).map((_, i) => ({ a: arrA[i], b: arrB[i] }));
}
