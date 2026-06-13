import React from 'react';
import D from '../data';

export default function Ticker({ snapshot }) {
  if (!snapshot) return null;

  const { states, teams, now } = snapshot;

  // Gather all playable fixtures (group fixtures + resolved knockout fixtures)
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

  const withState = allPlayable
    .map(i => ({ ...i, st: states[i.fx.id] }))
    .filter(i => i.st);

  const lives = withState.filter(i => i.st.status === 'live' || i.st.status === 'ht');
  const finished = withState.filter(i => i.st.status === 'ft')
    .sort((a, b) => b.fx.ts - a.fx.ts)
    .slice(0, 8);
  const upcoming = withState.filter(i => i.st.status === 'pre' && i.fx.ts > now)
    .sort((a, b) => a.fx.ts - b.fx.ts)
    .slice(0, 8);

  const seq = [...lives, ...upcoming, ...finished];

  const renderItem = (i, indexKey) => {
    const { fx, st } = i;
    const teamA = D.TEAMS[fx.a];
    const teamB = D.TEAMS[fx.b];
    if (!teamA || !teamB) return null;

    const flagA = D.flag(fx.a);
    const flagB = D.flag(fx.b);

    if (st.status === 'live' || st.status === 'ht') {
      const minText = st.status === 'ht' ? 'HT' : `${st.minute}′`;
      return (
        <span className="ticker-item" key={indexKey}>
          <span className="t-live">● {minText}</span>
          <img src={flagA} alt="" />
          {teamA.name}
          <span className="t-score">{st.sa} – {st.sb}</span>
          {teamB.name}
          <img src={flagB} alt="" />
        </span>
      );
    }

    if (st.status === 'ft') {
      return (
        <span className="ticker-item" key={indexKey}>
          FT <img src={flagA} alt="" />
          {teamA.name}
          <span className="t-score">{st.sa} – {st.sb}</span>
          {teamB.name}
          <img src={flagB} alt="" />
        </span>
      );
    }

    return (
      <span className="ticker-item" key={indexKey}>
        <span className="t-time">{fx.d} · {fx.t}</span>
        <img src={flagA} alt="" />
        {teamA.name} v {teamB.name}
        <img src={flagB} alt="" />
      </span>
    );
  };

  return (
    <div className="ticker-wrap">
      <div className="ticker">
        {seq.length > 0 ? (
          <>
            {/* Render items twice for a seamless looping marquee marquee */}
            {seq.map((item, idx) => renderItem(item, `first-${item.fx.id}-${idx}`))}
            {seq.map((item, idx) => renderItem(item, `second-${item.fx.id}-${idx}`))}
          </>
        ) : (
          Array.from({ length: 8 }).map((_, idx) => (
            <span className="ticker-item" key={`placeholder-${idx}`}>
              FIFA WORLD CUP 2026 · USA · CANADA · MEXICO · JUN 12 – JUL 20
            </span>
          ))
        )}
      </div>
    </div>
  );
}
