import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import LottieComponent from 'lottie-react';
import D from '../data';
import RevealSection from './RevealSection';
import BrandText from './BrandText';
import jugglingAnim from '../assets/juggling.json';
import fifaLogoAnim from '../assets/Fifa-logo.json';

const Lottie = LottieComponent.default || LottieComponent;

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

/* ── helper: measure ko-row centers relative to a reference element ── */
function getRowCenter(matchId, side, refEl) {
  if (!refEl) return null;
  const card = document.getElementById(matchId);
  if (!card) return null;
  const row = card.querySelector(`.ko-row[data-side="${side}"]`);
  if (!row) return null;
  const refRect = refEl.getBoundingClientRect();
  const rowRect = row.getBoundingClientRect();
  return rowRect.top + rowRect.height / 2 - refRect.top;
}

function getCardCenter(matchId, refEl) {
  if (!refEl) return null;
  const card = document.getElementById(matchId);
  if (!card) return null;
  const refRect = refEl.getBoundingClientRect();
  const cardRect = card.getBoundingClientRect();
  return cardRect.top + cardRect.height / 2 - refRect.top;
}



function KoCard({ m, st, teams }) {
  const codeA = teams?.[0];
  const codeB = teams?.[1];

  const live = st && ['live', 'ht', 'et1', 'et2', 'et-ht', 'pen'].includes(st.status);
  const isFt = st && st.status === 'ft' && st.winner;

  const renderRow = (code, side) => {
    const isWinner = isFt && st.winner === code;
    const isLoser = isFt && st.winner !== code;
    const nameCls = code ? 'ko-name' : 'ko-name placeholder';
    const rowCls = `ko-row ${isWinner ? 'winner' : ''} ${isLoser ? 'loser' : ''}`;

    const scoreVal = st && st.sa !== null ? (side === 0 ? st.sa : st.sb) : null;
    const pensVal = st && st.pensA !== null ? (side === 0 ? st.pensA : st.pensB) : null;
    const hasPens = st && st.pensA !== null && (st.pensA > 0 || st.pensB > 0);

    return (
      <div className={rowCls} data-side={side}>
        {code ? (
          <img className="flagchip" src={D.flag(code)} alt="" />
        ) : (
          <span className="seal" />
        )}
        <span className={nameCls}>
          {code ? D.TEAMS[code].name : D.srcLabel(m.src[side])}
        </span>
        <span className="ko-score">
          {scoreVal !== null ? (
            <>
              <ScoreDisplay value={scoreVal} />
              {hasPens && pensVal !== null && (
                <span className="pens">({pensVal})</span>
              )}
            </>
          ) : (
            ''
          )}
        </span>
      </div>
    );
  };

  return (
    <div className={`ko-card ${live ? 'is-live' : ''}`} id={m.id}>
      <div className="ko-head">
        <span className="kh-l">{m.round === 'SF' ? 'SEMI · ' : ''}{m.id}</span>
        {live ? (
          <span className="live-tag">● LIVE {
            st.status === 'ht' ? 'HT' : 
            st.status === 'et-ht' ? 'ET HT' : 
            st.status === 'et1' ? 'ET1' : 
            st.status === 'et2' ? 'ET2' : 
            st.status === 'pen' ? 'PEN' : 
            st.isDelayed ? 'DELAYED' :
            st.isSuspended ? 'SUSPENDED' :
            `${st.minute}′`
          }</span>
        ) : (
          <span className="kh-r">
            {st && st.isDelayed ? 'DELAYED' :
             st && st.isSuspended ? 'SUSPENDED' :
             `${m.d} · ${m.t}`}
          </span>
        )}
      </div>
      <div className="ko-body">
        {renderRow(codeA, 0)}
        {renderRow(codeB, 1)}
      </div>
    </div>
  );
}

function FinalCard({ m, st, teams }) {
  const codeA = teams?.[0];
  const codeB = teams?.[1];

  const live = st && ['live', 'ht', 'et1', 'et2', 'et-ht', 'pen'].includes(st.status);
  const isFt = st && st.status === 'ft' && st.winner;

  const renderRow = (code, side) => {
    const isWinner = isFt && st.winner === code;
    const isLoser = isFt && st.winner !== code;
    const nameCls = code ? 'ko-name' : 'ko-name placeholder';
    const rowCls = `ko-row ${isWinner ? 'winner' : ''} ${isLoser ? 'loser' : ''}`;

    const scoreVal = st && st.sa !== null ? (side === 0 ? st.sa : st.sb) : null;
    const pensVal = st && st.pensA !== null ? (side === 0 ? st.pensA : st.pensB) : null;
    const hasPens = st && st.pensA !== null && (st.pensA > 0 || st.pensB > 0);

    return (
      <div className={rowCls} data-side={side}>
        {code ? (
          <img className="flagchip" src={D.flag(code)} alt="" />
        ) : (
          <span className="seal" />
        )}
        <span className={nameCls}>
          {code ? D.TEAMS[code].name : D.srcLabel(m.src[side])}
        </span>
        <span className="ko-score">
          {scoreVal !== null ? (
            <>
              <ScoreDisplay value={scoreVal} />
              {hasPens && pensVal !== null && (
                <span className="pens">({pensVal})</span>
              )}
            </>
          ) : (
            ''
          )}
        </span>
      </div>
    );
  };

  return (
    <div className={`final-card ${live ? 'is-live' : ''}`} id={m.id}>
      <div className="final-head">
        <div className="f-title">FINAL</div>
        {live ? (
          <div className="f-sub">
            <span className="live-tag">● LIVE {
              st.status === 'ht' ? 'HT' : 
              st.status === 'et-ht' ? 'ET HT' : 
              st.status === 'et1' ? 'ET1' : 
              st.status === 'et2' ? 'ET2' : 
              st.status === 'pen' ? 'PEN' : 
              st.isDelayed ? 'DELAYED' :
              st.isSuspended ? 'SUSPENDED' :
              `${st.minute}′`
            }</span>
          </div>
        ) : (
          <div className="f-sub" id="final-sub">
            M104 · 20 JUL · NEW YORK / NJ {st && st.isDelayed ? '· DELAYED' : st && st.isSuspended ? '· SUSPENDED' : ''}
          </div>
        )}
      </div>
      <div className="final-body">
        {renderRow(codeA, 0)}
        <div className="final-vs">VS</div>
        {renderRow(codeB, 1)}
      </div>
    </div>
  );
}

function ThirdPlaceCard({ m, st, teams }) {
  const codeA = teams?.[0];
  const codeB = teams?.[1];

  const live = st && ['live', 'ht', 'et1', 'et2', 'et-ht', 'pen'].includes(st.status);
  const isFt = st && st.status === 'ft' && st.winner;

  const renderRow = (code, side) => {
    const isWinner = isFt && st.winner === code;
    const isLoser = isFt && st.winner !== code;
    const nameCls = code ? 'ko-name' : 'ko-name placeholder';
    const rowCls = `ko-row ${isWinner ? 'winner' : ''} ${isLoser ? 'loser' : ''}`;

    const scoreVal = st && st.sa !== null ? (side === 0 ? st.sa : st.sb) : null;
    const pensVal = st && st.pensA !== null ? (side === 0 ? st.pensA : st.pensB) : null;
    const hasPens = st && st.pensA !== null && (st.pensA > 0 || st.pensB > 0);

    return (
      <div className={rowCls} data-side={side}>
        {code ? (
          <img className="flagchip" src={D.flag(code)} alt="" />
        ) : (
          <span className="seal" />
        )}
        <span className={nameCls}>
          {code ? D.TEAMS[code].name : D.srcLabel(m.src[side])}
        </span>
        <span className="ko-score">
          {scoreVal !== null ? (
            <>
              <ScoreDisplay value={scoreVal} />
              {hasPens && pensVal !== null && (
                <span className="pens">({pensVal})</span>
              )}
            </>
          ) : (
            ''
          )}
        </span>
      </div>
    );
  };

  return (
    <div className={`third-card-v2 ${live ? 'is-live' : ''}`} id={m.id}>
      <div className="third-head">
        <div className="t-title">THIRD PLACE</div>
        {live ? (
          <div className="t-sub">
            <span className="live-tag">● LIVE {
              st.status === 'ht' ? 'HT' : 
              st.status === 'et-ht' ? 'ET HT' : 
              st.status === 'et1' ? 'ET1' : 
              st.status === 'et2' ? 'ET2' : 
              st.status === 'pen' ? 'PEN' : 
              st.isDelayed ? 'DELAYED' :
              st.isSuspended ? 'SUSPENDED' :
              `${st.minute}′`
            }</span>
          </div>
        ) : (
          <div className="t-sub" id="third-sub">
            M103 · 19 JUL · MIAMI {st && st.isDelayed ? '· DELAYED' : st && st.isSuspended ? '· SUSPENDED' : ''}
          </div>
        )}
      </div>
      <div className="third-body">
        {renderRow(codeA, 0)}
        <div className="third-vs">VS</div>
        {renderRow(codeB, 1)}
      </div>
    </div>
  );
}

function ChampionsBox({ champion }) {
  const isCrowned = !!champion;
  const team = champion ? D.TEAMS[champion] : null;
  const lottieRef = useRef(null);
  const containerRef = useRef(null);
  const hasPlayed = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasPlayed.current) {
          if (lottieRef.current) {
            lottieRef.current.play();
            hasPlayed.current = true;
          }
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className={`b-champ ${isCrowned ? 'crowned' : ''}`} id="champ-box" ref={containerRef}>
      <Lottie
        lottieRef={lottieRef}
        animationData={fifaLogoAnim}
        loop={false}
        autoplay={false}
        style={{ width: 140, height: 140, margin: '0 auto' }}
      />
      <div className="b-champ-label">WORLD CHAMPIONS</div>
      {champion ? (
        <div className="b-champ-team">
          <img src={D.flag(champion)} alt="" />
          <span>{team?.name}</span>
        </div>
      ) : (
        <div className="b-champ-await">
          <Lottie animationData={jugglingAnim} loop={true} style={{ width: 120, height: 120 }} />
        </div>
      )}
    </div>
  );
}

/* ─────────────── DOM-measured Connector Column ─────────────── */

function ConnCol({ matches, states, teams, dir }) {
  if (!matches) return null;
  const ref = useRef(null);
  const [paths, setPaths] = useState([]);
  const isToR = dir === 'to-r';
  const SVG_W = 64;
  const count = matches.length / 2;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const newPaths = [];
    for (let idx = 0; idx < count; idx++) {
      const matchA = matches[2 * idx];
      const matchB = matches[2 * idx + 1];
      const winnerCodeA = states[matchA.id]?.status === 'ft' ? states[matchA.id]?.winner : null;
      const winnerCodeB = states[matchB.id]?.status === 'ft' ? states[matchB.id]?.winner : null;
      const winASide = winnerCodeA ? (teams[matchA.id]?.[0] === winnerCodeA ? 0 : 1) : null;
      const winBSide = winnerCodeB ? (teams[matchB.id]?.[0] === winnerCodeB ? 0 : 1) : null;

      const cardCenterA = getCardCenter(matchA.id, el);
      const cardCenterB = getCardCenter(matchB.id, el);

      const yA = winASide !== null
        ? getRowCenter(matchA.id, winASide, el)
        : cardCenterA;
      const yB = winBSide !== null
        ? getRowCenter(matchB.id, winBSide, el)
        : cardCenterB;

      if (yA != null && yB != null && cardCenterA != null && cardCenterB != null) {
        newPaths.push({
          yA,
          yB,
          yOut: (cardCenterA + cardCenterB) / 2,
          isHighA: winASide !== null,
          isHighB: winBSide !== null
        });
      }
    }

    setPaths(prev => {
      const json = JSON.stringify(newPaths);
      if (JSON.stringify(prev) === json) return prev;
      return newPaths;
    });
  });

  const [tick, setTick] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setTick(t => t + 1));
    ro.observe(el);
    const bracket = document.getElementById('bracket-root');
    if (bracket) ro.observe(bracket);
    
    // Observe the specific match cards this connector relies on
    matches.forEach(m => {
      const card = document.getElementById(m.id);
      if (card) ro.observe(card);
    });
    
    return () => ro.disconnect();
  }, [matches]);

  const startX = isToR ? 0 : SVG_W;
  const midX = SVG_W / 2;
  const endX = isToR ? SVG_W : 0;

  return (
    <div className={`b-conn ${dir}`} ref={ref}>
      <svg
        width="100%"
        height="100%"
        style={{ display: 'block', position: 'absolute', top: 0, left: 0, overflow: 'visible' }}
      >
        {paths.map((p, i) => {
          return (
            <React.Fragment key={i}>
              <path
                d={`M ${startX} ${p.yA} L ${midX} ${p.yA} L ${midX} ${p.yOut} L ${endX} ${p.yOut}`}
                className={`elbow-path${p.isHighA ? ' highlighted' : ''}`}
              />
              <path
                d={`M ${startX} ${p.yB} L ${midX} ${p.yB} L ${midX} ${p.yOut} L ${endX} ${p.yOut}`}
                className={`elbow-path${p.isHighB ? ' highlighted' : ''}`}
              />
            </React.Fragment>
          );
        })}
      </svg>
    </div>
  );
}

/* ─────────────── DOM-measured Straight connector (SF → Final) ─────────────── */

function Straight({ match, states, teams, dir }) {
  if (!match) return null;
  const ref = useRef(null);
  const [line, setLine] = useState(null);
  const isToR = dir === 'to-r';
  const SVG_W = 46;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const winnerCode = states[match.id]?.status === 'ft' ? states[match.id]?.winner : null;
    const winSide = winnerCode ? (teams[match.id]?.[0] === winnerCode ? 0 : 1) : null;

    const ySrc = winSide !== null
      ? getRowCenter(match.id, winSide, el)
      : getCardCenter(match.id, el);

    // Keep it perfectly horizontal, pointing directly to the final card
    const yDst = ySrc;

    if (ySrc == null || yDst == null) {
      setLine(prev => prev === null ? prev : null);
      return;
    }

    const newLine = { ySrc, yDst, isHigh: winSide !== null };
    setLine(prev => {
      if (prev && prev.ySrc === newLine.ySrc && prev.yDst === newLine.yDst && prev.isHigh === newLine.isHigh) return prev;
      return newLine;
    });
  });

  const [tick, setTick] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setTick(t => t + 1));
    ro.observe(el);
    const bracket = document.getElementById('bracket-root');
    if (bracket) ro.observe(bracket);
    
    // Observe the match card and the final card
    const card = document.getElementById(match.id);
    if (card) ro.observe(card);
    const finalCard = document.getElementById('M104');
    if (finalCard) ro.observe(finalCard);
    
    return () => ro.disconnect();
  }, [match.id]);

  const startX = isToR ? 0 : SVG_W;
  const endX = isToR ? SVG_W : 0;

  return (
    <div className="b-conn-straight" ref={ref}>
      {line && (
        <svg
          width="100%"
          height="100%"
          style={{ display: 'block', position: 'absolute', top: 0, left: 0, overflow: 'visible' }}
        >
          <path
            d={`M ${startX} ${line.ySrc} L ${endX} ${line.yDst}`}
            className={`elbow-path${line.isHigh ? ' highlighted' : ''}`}
          />
        </svg>
      )}
    </div>
  );
}

function RoundCol({ matches, colCls, label, states, teams }) {
  const isCenterRound = matches.length <= 1;
  return (
    <div className={`b-col ${colCls} ${isCenterRound ? 'center-round' : ''}`}>
      <div className="b-round-label">{label}</div>
      {matches.map(m => (
        <KoCard key={m.id} m={m} st={states[m.id]} teams={teams[m.id]} />
      ))}
    </div>
  );
}

const Bracket = React.memo(function Bracket({ snapshot }) {
  const scrollRef = useRef(null);
  const centeredRef = useRef(false);

  // On first mount, pin the horizontal scroll to the middle so the FINAL /
  // champion column is centred rather than starting at the Round-of-32 edge.
  useEffect(() => {
    if (centeredRef.current) return;
    const el = scrollRef.current;
    if (!el) return;
    const center = () => {
      if (el.scrollWidth > el.clientWidth) {
        el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
        centeredRef.current = true;
      }
    };
    center();
    // Retry next frame in case layout/fonts settle the width slightly later.
    const raf = requestAnimationFrame(center);
    return () => cancelAnimationFrame(raf);
  });

  if (!snapshot) return null;

  const { states, teams, champion } = snapshot;
  const ko = (round, side) => D.KO.filter(m => m.round === round && m.side === side);

  const m103 = D.KO.find(m => m.id === 'M103');
  const m104 = D.KO.find(m => m.id === 'M104');

  return (
    <RevealSection id="bracket">
      <div className="rule-head">
        <div className="rule l"></div>
        <div style={{ textAlign: 'center' }}>
          <BrandText text="THE ROAD TO THE FINAL" className="section-brand-header" />
          <div className="section-brand-sub">LIVE TRACKER</div>
        </div>
        <div className="rule r"></div>
      </div>
      <div className="bracket-scroll" ref={scrollRef}>
        <div className="bracket" id="bracket-root">
          <RoundCol matches={ko('R32', 'L')} colCls="b-col-32" label="ROUND OF 32" states={states} teams={teams} />
          <ConnCol matches={ko('R32', 'L')} states={states} teams={teams} dir="to-r" />

          <RoundCol matches={ko('R16', 'L')} colCls="b-col-16" label="ROUND OF 16" states={states} teams={teams} />
          <ConnCol matches={ko('R16', 'L')} states={states} teams={teams} dir="to-r" />

          <RoundCol matches={ko('QF', 'L')} colCls="b-col-qf" label="QUARTER-FINALS" states={states} teams={teams} />
          <ConnCol matches={ko('QF', 'L')} states={states} teams={teams} dir="to-r" />

          <RoundCol matches={ko('SF', 'L')} colCls="b-col-sf" label="SEMI-FINALS" states={states} teams={teams} />
          <Straight match={ko('SF', 'L')[0]} states={states} teams={teams} dir="to-r" />

          {/* Center Column */}
          <div className="b-col b-col-c">
            <ChampionsBox champion={champion} />
            <FinalCard m={m104} st={states.M104} teams={teams.M104} />
            <ThirdPlaceCard m={m103} st={states.M103} teams={teams.M103} />
          </div>

          <Straight match={ko('SF', 'R')[0]} states={states} teams={teams} dir="to-l" />
          <RoundCol matches={ko('SF', 'R')} colCls="b-col-sf" label="SEMI-FINALS" states={states} teams={teams} />

          <ConnCol matches={ko('QF', 'R')} states={states} teams={teams} dir="to-l" />
          <RoundCol matches={ko('QF', 'R')} colCls="b-col-qf" label="QUARTER-FINALS" states={states} teams={teams} />

          <ConnCol matches={ko('R16', 'R')} states={states} teams={teams} dir="to-l" />
          <RoundCol matches={ko('R16', 'R')} colCls="b-col-16" label="ROUND OF 16" states={states} teams={teams} />

          <ConnCol matches={ko('R32', 'R')} states={states} teams={teams} dir="to-l" />
          <RoundCol matches={ko('R32', 'R')} colCls="b-col-32" label="ROUND OF 32" states={states} teams={teams} />
        </div>
      </div>
    </RevealSection>
  );
});

export default Bracket;
