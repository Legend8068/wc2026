import React, { useState, useEffect, useRef } from 'react';
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

function GroupRow({ r, isAllGroupsDone, groupOrder }) {
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
  const isQualified = isAllGroupsDone && r.rank <= 2;

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
      <div className="st-cell pts">{filled ? r.pts : ''}</div>
    </div>
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
            <div className="live-min">{st.status === 'ht' ? 'HT' : `${st.minute}′`}</div>
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

export default function Groups({ snapshot }) {
  if (!snapshot) return null;

  const { standings, states, allGroupsDone } = snapshot;

  const renderGroupCard = (g) => {
    const rows = standings[g] || [];
    const groupOrder = rows.map(r => r.code).join(',');
    const fixtures = D.GROUP_FIXTURES.filter(f => f.group === g);

    return (
      <article className="group-card" id={`group-${g}`} key={g}>
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
            <div>PTS</div>
          </div>
          <div className="st-rows">
            {rows.map(r => (
              <GroupRow
                key={r.code}
                r={r}
                isAllGroupsDone={allGroupsDone}
                groupOrder={groupOrder}
              />
            ))}
          </div>
          <div className="fx-label">FIXTURES &nbsp;<span>· SGT</span></div>
          {fixtures.map(fx => (
            <GroupFixtureRow key={fx.id} fx={fx} st={states[fx.id]} />
          ))}
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
      <div className="groups-grid" id="groups-grid">
        {Object.keys(D.GROUPS).map(renderGroupCard)}
      </div>
    </section>
  );
}
