import React, { useState, useEffect, useRef } from 'react';
import D from '../data';
import RevealSection from './RevealSection';
import BrandText from './BrandText';

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

export default function MatchCentre({ snapshot }) {
  const [tab, setTab] = useState('active'); // 'active' (Live / Recent) or 'upcoming'
  const [expandedMatchId, setExpandedMatchId] = useState(null);

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

  // Determine which matches to show based on selected tab
  let cards = [];
  let isUpcomingMode = false;
  let isTournamentComplete = false;

  if (tab === 'active') {
    if (activeMatches.length > 0) {
      cards = activeMatches;
    } else if (recentMatches.length > 0) {
      cards = recentMatches;
    } else {
      // Fallback if no active or completed matches exist yet
      cards = upcomingMatches;
      isUpcomingMode = true;
    }
  } else {
    if (upcomingMatches.length > 0) {
      cards = upcomingMatches;
      isUpcomingMode = true;
    } else {
      isTournamentComplete = true;
    }
  }

  const toggleExpand = (matchId) => {
    setExpandedMatchId(prev => (prev === matchId ? null : matchId));
  };

  const renderCard = ({ fx, label }) => {
    const st = states[fx.id];
    if (!st) return null;

    const isLive = st.status === 'live' || st.status === 'ht';
    const isFt = st.status === 'ft';
    const canExpand = isLive || isFt;
    const isExpanded = expandedMatchId === fx.id;

    const minTxt = isLive
      ? (st.status === 'ht' ? 'HT' : `${st.minute}′ LIVE`)
      : isFt ? 'FULL TIME' : `${fx.d} · ${fx.t} SGT`;

    const minCls = isLive ? '' : isFt ? ' ft' : ' pre';

    const teamA = D.TEAMS[fx.a];
    const teamB = D.TEAMS[fx.b];
    if (!teamA || !teamB) return null;

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
            <div className="lcv-score-box">
              {st.sa === null ? (
                <span className="lcv-vs">VS</span>
              ) : (
                <>
                  <ScoreDisplay value={st.sa} />
                  <span className="lcv-colon">-</span>
                  <ScoreDisplay value={st.sb} />
                </>
              )}
            </div>
            <div className="lcv-info-box">
              <div className="lcv-label">{label}</div>
              <div className={`lcv-time${minCls}`}>{minTxt}</div>
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
            {/* Timeline Section */}
            <div className="mc-timeline-section">
              <div className="mc-details-header">MATCH EVENTS</div>
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
                            <div className="mc-event-content">
                              <span className="mc-player-name">{ev.player}</span>
                              <span className="mc-event-icon" title={ev.typeText}>{getEventIcon(ev)}</span>
                            </div>
                          )}
                        </div>
                        <div className="mc-timeline-middle">{ev.clock}</div>
                        <div className="mc-timeline-right">
                          {!isHome && (
                            <div className="mc-event-content">
                              <span className="mc-event-icon" title={ev.typeText}>{getEventIcon(ev)}</span>
                              <span className="mc-player-name">{ev.player}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
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
        <button 
          className={`mc-tab-btn ${tab === 'active' ? 'active' : ''}`} 
          onClick={() => { setTab('active'); setExpandedMatchId(null); }}
        >
          {activeMatches.length > 0 ? `LIVE (${activeMatches.length})` : 'LIVE & RECENT'}
        </button>
        <button 
          className={`mc-tab-btn ${tab === 'upcoming' ? 'active' : ''}`} 
          onClick={() => { setTab('upcoming'); setExpandedMatchId(null); }}
        >
          UPCOMING
        </button>
      </div>

      {tab === 'active' && activeMatches.length === 0 && recentMatches.length === 0 && (
        <div className="live-empty">NO LIVE MATCHES AT THE MOMENT · SHOWING UPCOMING</div>
      )}
      {isUpcomingMode && tab === 'upcoming' && (
        <div className="live-empty">NO MATCH IN PLAY — <b>UP NEXT</b></div>
      )}
      {isTournamentComplete && (
        <div className="live-empty">TOURNAMENT COMPLETE — <b>SEE THE BRACKET FOR THE CHAMPION</b></div>
      )}

      <div className="live-strip" id="live-strip">
        {cards.map(renderCard)}
      </div>
    </RevealSection>
  );
}
