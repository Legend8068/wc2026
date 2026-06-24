import React, { useState, useEffect, useRef } from 'react';
import LottieComponent from 'lottie-react';
import D from '../data';
import RevealSection from './RevealSection';
import BrandText from './BrandText';
import jugglingAnim from '../assets/juggling.json';

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

  return (
    <div className={`b-champ ${isCrowned ? 'crowned' : ''}`} id="champ-box">
      <svg className="trophy" width="68" height="68" viewBox="0 0 24 24" fill="none" stroke="#e8b84b" strokeWidth="1.3">
        <path d="M7 4h10v4a5 5 0 0 1-10 0V4z"></path>
        <path d="M7 5H4v2a3 3 0 0 0 3 3"></path>
        <path d="M17 5h3v2a3 3 0 0 1-3 3"></path>
        <path d="M12 13v3"></path>
        <path d="M9.5 20h5"></path>
        <path d="M10 16.5h4V20h-4z"></path>
      </svg>
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

function ElbowSvg({ count, winA1, winA2, winB1, winB2, dir }) {
  const isToR = dir === 'to-r';
  const H = 836 / count;
  
  // Faint lines: center to center
  const yA_center = H / 4;
  const yB_center = (3 * H) / 4;
  const y_out_center = H / 2;

  // Highlighted line source coordinates (exact team row)
  const yA1 = H / 4 - 1;
  const yA2 = H / 4 + 27;
  const yB1 = (3 * H) / 4 - 1;
  const yB2 = (3 * H) / 4 + 27;

  // Outgoing slots
  const y_out_top = H / 2 - 1;
  const y_out_bottom = H / 2 + 27;

  // SVG width = 64
  const startX = isToR ? 0 : 64;
  const midX = 32;
  const endX = isToR ? 64 : 0;

  return (
    <svg width="100%" height="100%" style={{ display: 'block' }}>
      {/* Faint default lines */}
      {!winA1 && !winA2 && (
        <path 
          d={`M ${startX} ${yA_center} L ${midX} ${yA_center} L ${midX} ${y_out_center} L ${endX} ${y_out_center}`} 
          className="elbow-path" 
        />
      )}
      {!winB1 && !winB2 && (
        <path 
          d={`M ${startX} ${yB_center} L ${midX} ${yB_center} L ${midX} ${y_out_center} L ${endX} ${y_out_center}`} 
          className="elbow-path" 
        />
      )}

      {/* Highlighted lines */}
      {winA1 && <path d={`M ${startX} ${yA1} L ${midX} ${yA1} L ${midX} ${y_out_top} L ${endX} ${y_out_top}`} className="elbow-path highlighted" />}
      {winA2 && <path d={`M ${startX} ${yA2} L ${midX} ${yA2} L ${midX} ${y_out_top} L ${endX} ${y_out_top}`} className="elbow-path highlighted" />}
      {winB1 && <path d={`M ${startX} ${yB1} L ${midX} ${yB1} L ${midX} ${y_out_bottom} L ${endX} ${y_out_bottom}`} className="elbow-path highlighted" />}
      {winB2 && <path d={`M ${startX} ${yB2} L ${midX} ${yB2} L ${midX} ${y_out_bottom} L ${endX} ${y_out_bottom}`} className="elbow-path highlighted" />}
    </svg>
  );
}

function ConnCol({ matches, states, teams, dir }) {
  if (!matches) return null;
  const count = matches.length / 2;
  return (
    <div className={`b-conn ${dir}`}>
      {Array.from({ length: count }).map((_, idx) => {
        const matchA = matches[2 * idx];
        const matchB = matches[2 * idx + 1];

        const winnerCodeA = states[matchA.id]?.status === 'ft' ? states[matchA.id]?.winner : null;
        const winnerCodeB = states[matchB.id]?.status === 'ft' ? states[matchB.id]?.winner : null;

        const winA1 = winnerCodeA && teams[matchA.id]?.[0] === winnerCodeA;
        const winA2 = winnerCodeA && teams[matchA.id]?.[1] === winnerCodeA;
        const winB1 = winnerCodeB && teams[matchB.id]?.[0] === winnerCodeB;
        const winB2 = winnerCodeB && teams[matchB.id]?.[1] === winnerCodeB;

        return (
          <div className="elbow" key={idx}>
            <ElbowSvg 
              count={count} 
              winA1={winA1} winA2={winA2} 
              winB1={winB1} winB2={winB2} 
              dir={dir} 
            />
          </div>
        );
      })}
    </div>
  );
}

function Straight({ match, states }) {
  const isWinner = !!(match && states[match.id]?.status === 'ft' && states[match.id]?.winner);
  return (
    <div className="b-conn-straight">
      <svg width="100%" height="100%" viewBox="0 0 46 100" preserveAspectRatio="none" style={{ display: 'block' }}>
        <path 
          d="M 0 50 L 46 50" 
          className={`elbow-path ${isWinner ? 'highlighted' : ''}`}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
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
          <Straight match={ko('SF', 'L')[0]} states={states} />

          {/* Center Column */}
          <div className="b-col b-col-c">
            <ChampionsBox champion={champion} />
            <FinalCard m={m104} st={states.M104} teams={teams.M104} />
            <ThirdPlaceCard m={m103} st={states.M103} teams={teams.M103} />
          </div>

          <Straight match={ko('SF', 'R')[0]} states={states} />
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
