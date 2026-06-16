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

export default function Groups({ snapshot }) {
  const gridRef = useRef(null);
  const colCount = useColumnCount(gridRef);

  if (!snapshot) return null;

  const { standings, states, thirdStandings } = snapshot;
  const groupKeys = Object.keys(D.GROUPS);

  const renderGroupCard = (g) => {
    const rows = standings[g] || [];
    const groupOrder = rows.map(r => r.code).join(',');
    const fixtures = D.GROUP_FIXTURES.filter(f => f.group === g);
    const gc = groupKeys.indexOf(g) % 3; // 0 green · 1 red · 2 blue (matches original cycle)

    return (
      <article className={`group-card gc-${gc}`} id={`group-${g}`} key={g}>
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
              />
            ))}
          </div>
          <details className="fx-dropdown">
            <summary className="fx-label">FIXTURES &nbsp;<span>· SGT</span></summary>
            {fixtures.map(fx => (
              <GroupFixtureRow key={fx.id} fx={fx} st={states[fx.id]} />
            ))}
          </details>
        </div>
      </article>
    );
  };

  return (
    <section id="groups">
      <div className="big-head">
        <BrandText text="THE 48 · GROUP STAGE" className="section-brand-header" />
        <div className="rule" />
      </div>
      <ThirdPlaceTable rows={thirdStandings} />
      <div className="groups-grid" id="groups-grid" ref={gridRef}>
        {Array.from({ length: colCount }, (_, c) => (
          <div className="groups-col" key={c}>
            {/* round-robin keeps row-major reading order: A,B,C across the top row */}
            {groupKeys.filter((_, i) => i % colCount === c).map(renderGroupCard)}
          </div>
        ))}
      </div>
    </section>
  );
}
