import React, { useState, useEffect, useRef } from 'react';
import { motion, LayoutGroup } from 'framer-motion';
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

const TableCell = React.memo(({ value, className }) => {
  const [pop, setPop] = useState(false);
  const prevVal = useRef(value);

  useEffect(() => {
    if (value !== prevVal.current && value !== null && prevVal.current !== null && value !== '') {
      setPop(true);
      const t = setTimeout(() => setPop(false), 700);
      prevVal.current = value;
      return () => clearTimeout(t);
    }
    prevVal.current = value;
  }, [value]);

  return <div className={`st-cell ${className || ''} ${pop ? 'pop' : ''}`}>{value !== null ? value : ''}</div>;
});

const GroupRow = React.memo(({ r, groupOrder, hoveredTeam, onMouseEnter, onMouseLeave }) => {
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
  const isHighlighted = r.code === hoveredTeam;

  return (
    <motion.div
      layout
      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
      data-code={r.code}
    >
      <div
        className={`st-row ${isQualified ? 'qualified' : ''} ${moved ? 'moved' : ''} ${isHighlighted ? 'highlight' : ''}`}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div className="st-team">
          <img src={D.flag(r.code)} alt="" loading="lazy" />
          <span>{D.TEAMS[r.code].name}</span>
        </div>
        <TableCell value={filled ? r.p : ''} />
        <TableCell value={filled ? r.w : ''} />
        <TableCell value={filled ? r.d : ''} />
        <TableCell value={filled ? r.l : ''} />
        <TableCell value={filled ? formatGD(r.gd) : ''} className="gd" />
        <TableCell value={filled ? r.pts : ''} className="pts" />
      </div>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  return prevProps.hoveredTeam === nextProps.hoveredTeam &&
         prevProps.groupOrder === nextProps.groupOrder &&
         prevProps.r.code === nextProps.r.code &&
         prevProps.r.p === nextProps.r.p &&
         prevProps.r.w === nextProps.r.w &&
         prevProps.r.d === nextProps.r.d &&
         prevProps.r.l === nextProps.r.l &&
         prevProps.r.gd === nextProps.r.gd &&
         prevProps.r.pts === nextProps.r.pts &&
         prevProps.r.qualified === nextProps.r.qualified;
});

const ThirdsRow = React.memo(({ r, hoveredTeam, onMouseEnter, onMouseLeave }) => {
  const [moved, setMoved] = useState(false);
  const prevRank = useRef(r.thirdRank);

  useEffect(() => {
    if (r.thirdRank !== prevRank.current && prevRank.current !== '') {
      setMoved(true);
      const t = setTimeout(() => setMoved(false), 700);
      prevRank.current = r.thirdRank;
      return () => clearTimeout(t);
    }
    prevRank.current = r.thirdRank;
  }, [r.thirdRank]);

  const filled = r.p > 0;
  const inCut = r.thirdRank <= 8;
  const isHighlighted = r.code === hoveredTeam;

  return (
    <motion.div
      layout
      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
    >
      <div
        className={`thirds-row ${inCut ? 'in-cut' : ''} ${r.qualified ? 'qualified' : ''} ${moved ? 'moved' : ''} ${isHighlighted ? 'highlight' : ''}`}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div className="third-rank">{r.thirdRank}</div>
        <div className="third-group">{r.group}</div>
        <div className="st-team">
          <img src={D.flag(r.code)} alt="" loading="lazy" />
          <span>{D.TEAMS[r.code].name}</span>
        </div>
        <TableCell value={filled ? r.p : ''} />
        <TableCell value={filled ? r.w : ''} />
        <TableCell value={filled ? r.d : ''} />
        <TableCell value={filled ? r.l : ''} />
        <TableCell value={filled ? formatGD(r.gd) : ''} className="gd" />
        <TableCell value={filled ? r.pts : ''} className="pts" />
      </div>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  return prevProps.hoveredTeam === nextProps.hoveredTeam &&
         prevProps.r.code === nextProps.r.code &&
         prevProps.r.thirdRank === nextProps.r.thirdRank &&
         prevProps.r.group === nextProps.r.group &&
         prevProps.r.p === nextProps.r.p &&
         prevProps.r.w === nextProps.r.w &&
         prevProps.r.d === nextProps.r.d &&
         prevProps.r.l === nextProps.r.l &&
         prevProps.r.gd === nextProps.r.gd &&
         prevProps.r.pts === nextProps.r.pts &&
         prevProps.r.qualified === nextProps.r.qualified;
});

function ThirdPlaceTable({ rows, hoveredTeam, setHoveredTeam }) {
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
          <LayoutGroup id="thirds-layout">
            {rows.map(r => (
              <ThirdsRow 
                key={`${r.group}-${r.code}`} 
                r={r} 
                hoveredTeam={hoveredTeam}
                onMouseEnter={() => setHoveredTeam(r.code)}
                onMouseLeave={() => setHoveredTeam(null)}
              />
            ))}
          </LayoutGroup>
        </div>
      </div>
    </article>
  );
}

function GroupFixtureRow({ fx, st, hoveredTeam }) {
  if (!st) return null;
  const isLive = ['live', 'ht', 'et1', 'et2', 'et-ht', 'pen'].includes(st.status);
  const isHighlighted = hoveredTeam && (fx.a === hoveredTeam || fx.b === hoveredTeam);
  const isDimmed = hoveredTeam && !isHighlighted;

  return (
    <div className={`fx-row ${isLive ? 'is-live' : ''} ${isHighlighted ? 'highlight' : ''} ${isDimmed ? 'dim' : ''}`} id={`fx-${fx.id}`}>
      <div className="fx-when">
        {isLive ? (
          <>
            <div className="d">{fx.d}</div>
            <div className="live-min">
              {st.status === 'ht' ? 'HT' :
               st.status === 'et-ht' ? 'ET HT' :
               st.status === 'et1' ? `${st.minute}′ ET1` :
               st.status === 'et2' ? `${st.minute}′ ET2` :
               st.status === 'pen' ? 'PENALTIES' :
               st.isDelayed ? `${st.clockText || st.minute}′ DELAYED` :
               st.isSuspended ? `${st.clockText || st.minute}′ SUSP` :
               `${st.clockText || st.minute}′`}
            </div>
          </>
        ) : (
          <>
            <div className="d">{fx.d}</div>
            <div className="t">
              {st.isDelayed ? 'DELAYED' :
               st.isSuspended ? 'SUSPENDED' :
               fx.t}
            </div>
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

function GroupCard({ g, rows, groupOrder, fixtures, states, gc, hoveredTeam, setHoveredTeam }) {
  const [expanded, setExpanded] = useState(false);

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
          <LayoutGroup id={`group-layout-${g}`}>
            {rows.map(r => (
              <GroupRow
                key={r.code}
                r={r}
                groupOrder={groupOrder}
                hoveredTeam={hoveredTeam}
                onMouseEnter={() => setHoveredTeam(r.code)}
                onMouseLeave={() => setHoveredTeam(null)}
              />
            ))}
          </LayoutGroup>
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

const Groups = React.memo(function Groups({ snapshot }) {
  const gridRef = useRef(null);
  const colCount = useColumnCount(gridRef);
  const [hoveredTeam, setHoveredTeam] = useState(null);

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
          <ThirdPlaceTable 
            rows={thirdStandings} 
            hoveredTeam={hoveredTeam}
            setHoveredTeam={setHoveredTeam}
          />
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
                  hoveredTeam={hoveredTeam}
                  setHoveredTeam={setHoveredTeam}
                />
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
});

export default Groups;
