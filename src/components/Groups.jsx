import { useState, useEffect, useRef } from 'react';
import D from '../data';
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

function formatGD(value) {
  if (value > 0) return `+${value}`;
  return String(value);
}

function GroupRow({ r, groupOrder }) {
  const [moved, setMoved] = useState(false);
  const prevOrder = useRef(groupOrder);

  useEffect(() => {
    if (groupOrder !== prevOrder.current && prevOrder.current !== '') {
      setMoved(true);
      const t = setTimeout(() => setMoved(false), 700);
      prevOrder.current = groupOrder;
      return () => clearTimeout(t);
    }
    prevOrder.current = groupOrder;
  }, [groupOrder]);

  const filled = r.p > 0;
  const isQualified = Boolean(r.qualified);

  return (
    <div
      className={`st-row ${isQualified ? 'qualified' : ''} ${moved ? 'moved' : ''}`}
      data-code={r.code}
    >
      <div className="st-team">
        <img src={D.flag(r.code)} alt="" loading="lazy" />
        <span>{D.TEAMS[r.code].name}</span>
      </div>
      <div className="st-cell">{filled ? r.p : ''}</div>
      <div className="st-cell">{filled ? r.w : ''}</div>
      <div className="st-cell">{filled ? r.d : ''}</div>
      <div className="st-cell">{filled ? r.l : ''}</div>
      <div className="st-cell gd">{filled ? formatGD(r.gd) : ''}</div>
      <div className="st-cell pts">{filled ? r.pts : ''}</div>
    </div>
  );
}

function ThirdPlaceTable({ rows }) {
  if (!rows || rows.length === 0) return null;

  return (
    <article className="thirds-card" aria-labelledby="thirds-heading">
      <div className="g-head">
        <div className="g-tag">3RD PLACE</div>
        <div className="g-sub" id="thirds-heading">OVERALL RANKING</div>
      </div>
      <div className="thirds-body">
        <div className="thirds-grid-head">
          <div>#</div>
          <div>GROUP</div>
          <div className="team-col">TEAM</div>
          <div>P</div>
          <div>W</div>
          <div>D</div>
          <div>L</div>
          <div>GD</div>
          <div>PTS</div>
        </div>
        <div className="thirds-rows">
          {rows.map(r => {
            const filled = r.p > 0;
            const inCut = r.thirdRank <= 8;
            return (
              <div
                className={`thirds-row ${inCut ? 'in-cut' : ''} ${r.qualified ? 'qualified' : ''}`}
                key={`${r.group}-${r.code}`}
              >
                <div className="third-rank">{r.thirdRank}</div>
                <div className="third-group">{r.group}</div>
                <div className="st-team">
                  <img src={D.flag(r.code)} alt="" loading="lazy" />
                  <span>{D.TEAMS[r.code].name}</span>
                </div>
                <div className="st-cell">{filled ? r.p : ''}</div>
                <div className="st-cell">{filled ? r.w : ''}</div>
                <div className="st-cell">{filled ? r.d : ''}</div>
                <div className="st-cell">{filled ? r.l : ''}</div>
                <div className="st-cell gd">{filled ? formatGD(r.gd) : ''}</div>
                <div className="st-cell pts">{filled ? r.pts : ''}</div>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}

function GroupFixtureRow({ fx, st }) {
  if (!st) return null;
  const isLive = st.status === 'live' || st.status === 'ht';

  return (
    <div className={`fx-row ${isLive ? 'is-live' : ''}`} id={`fx-${fx.id}`}>
      <div className="fx-when">
        {isLive ? (
          <>
            <div className="d">{fx.d}</div>
            <div className="live-min">{st.status === 'ht' ? 'HT' : `${st.clockText || st.minute}′`}</div>
          </>
        ) : (
          <>
            <div className="d">{fx.d}</div>
            <div className="t">{fx.t}</div>
          </>
        )}
      </div>
      <span className="fx-teams">
        {D.TEAMS[fx.a].name} <span className="v">v</span> {D.TEAMS[fx.b].name}
      </span>
      <div className="fx-score">
        <b data-side="0">
          <ScoreDisplay value={st.sa} />
        </b>
        <b data-side="1">
          <ScoreDisplay value={st.sb} />
        </b>
      </div>
    </div>
  );
}

// Number of masonry columns that fit, mirroring the old `minmax(330px, 1fr)` grid.
function useColumnCount(ref, minCol = 330, gap = 24) {
  const [cols, setCols] = useState(3);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const compute = () => {
      const w = el.clientWidth;
      if (w > 0) setCols(Math.max(1, Math.floor((w + gap) / (minCol + gap))));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, minCol, gap]);
  return cols;
}

function TiebreakerRules() {
  const groupRules = [
    "Points in head-to-head matches",
    "Goal difference in head-to-head matches",
    "Goals scored in head-to-head matches",
    "Overall goal difference",
    "Overall goals scored",
    "Team conduct score (cards)",
    "FIFA World Ranking"
  ];
  const thirdRules = [
    "Overall points",
    "Overall goal difference",
    "Overall goals scored",
    "Team conduct score (cards)",
    "FIFA World Ranking"
  ];

  return (
    <article className="rules-card" aria-labelledby="rules-heading">
      <div className="g-head">
        <div className="g-tag" style={{ background: 'var(--red)', color: 'white' }}>RULES</div>
        <div className="g-sub" id="rules-heading">TIEBREAKER CRITERIA</div>
      </div>
      <div className="rules-body">
        <div className="rules-section">
          <h4>Group Stage Tiebreakers</h4>
          <div className="rules-list">
            {groupRules.map((rule, i) => (
              <div className="rule-item" key={i}>
                <span className="rule-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="rule-text">{rule}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="rules-section">
          <h4>3rd Place Teams Ranking</h4>
          <div className="rules-list">
            {thirdRules.map((rule, i) => (
              <div className="rule-item" key={i}>
                <span className="rule-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="rule-text">{rule}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

function GroupCard({ g, rows, groupOrder, fixtures, states, gc }) {
  const [expanded, setExpanded] = useState(false);
  const [hoveredTeam, setHoveredTeam] = useState(null);

  return (
    <article 
      className={`group-card gc-${gc}`} 
      id={`group-${g}`} 
      key={g}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => {
        setExpanded(false);
        setHoveredTeam(null);
      }}
    >
      <div className="g-head">
        <div className="g-tag">GROUP {g}</div>
        <div className="g-sub">STANDINGS</div>
      </div>
      <div className="g-body">
        <div className="st-grid-head">
          <div className="team-col">TEAM</div>
          <div>P</div>
          <div>W</div>
          <div>D</div>
          <div>L</div>
          <div>GD</div>
          <div>PTS</div>
        </div>
        <div className="st-rows">
          {rows.map(r => (
            <GroupRow
              key={r.code}
              r={r}
              groupOrder={groupOrder}
              onMouseEnter={() => setHoveredTeam(r.code)}
              onMouseLeave={() => setHoveredTeam(null)}
            />
          ))}
        </div>
        <div className={`fx-accordion ${expanded ? 'is-expanded' : ''}`}>
          <button className="fx-label" onClick={() => setExpanded(!expanded)} type="button">
            FIXTURES &nbsp;<span>· SGT</span>
            <svg viewBox="0 0 24 24" className="chevron" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          <div className="fx-accordion-content">
            <div className="fx-accordion-inner">
              {fixtures.map(fx => (
                <GroupFixtureRow key={fx.id} fx={fx} st={states[fx.id]} hoveredTeam={hoveredTeam} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function Groups({ snapshot }) {
  const gridRef = useRef(null);
  const colCount = useColumnCount(gridRef);

  if (!snapshot) return null;

  const { standings, states, thirdStandings } = snapshot;
  const groupKeys = Object.keys(D.GROUPS);

  return (
    <section id="groups">
      <div className="big-head">
        <BrandText text="THE 48 · GROUP STAGE" className="section-brand-header" />
        <div className="rule" />
      </div>
      <div className="thirds-and-rules-row">
        <div className="thirds-wrapper">
          <ThirdPlaceTable rows={thirdStandings} />
        </div>
        <div className="rules-wrapper">
          <TiebreakerRules />
        </div>
      </div>
      <div className="groups-grid" id="groups-grid" ref={gridRef}>
        {Array.from({ length: colCount }, (_, c) => (
          <div className="groups-col" key={c}>
            {/* round-robin keeps row-major reading order: A,B,C across the top row */}
            {groupKeys.filter((_, i) => i % colCount === c).map(g => {
              const rows = standings[g] || [];
              const groupOrder = rows.map(r => r.code).join(',');
              const fixtures = D.GROUP_FIXTURES.filter(f => f.group === g);
              const gc = groupKeys.indexOf(g) % 3;
              return (
                <GroupCard 
                  key={g} 
                  g={g} 
                  rows={rows} 
                  groupOrder={groupOrder} 
                  fixtures={fixtures} 
                  states={states} 
                  gc={gc} 
                />
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
