/* ============================================================
   WC2026 — UI renderer
   Builds the bracket / groups DOM once, then patches it from
   each engine snapshot (score pops, live rings, standings
   reordering, bracket fills, champion crowning, ticker).
   ============================================================ */
window.WC = window.WC || {};

WC.ui = (() => {
  const D = WC.data;
  const $ = (s, el = document) => el.querySelector(s);
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };

  let prevScores = {};     // matchId -> "sa-sb" for pop detection
  let prevOrder = {};      // group  -> "MEX,RSA,..." for reorder glow
  let crowned = false;

  /* ---------------- build: knockout card ---------------- */
  function koCard(m) {
    const card = el('div', 'ko-card');
    card.id = m.id;
    card.innerHTML = `
      <div class="ko-head"><span class="kh-l">${m.round === 'SF' ? 'SEMI · ' : ''}${m.id}</span><span class="kh-r">${m.d} · ${m.t}</span></div>
      <div class="ko-body">
        ${[0, 1].map(i => `
          <div class="ko-row" data-side="${i}">
            <span class="seal"></span>
            <span class="ko-name placeholder">${D.srcLabel(m.src[i])}</span>
            <span class="ko-score"></span>
          </div>`).join('')}
      </div>`;
    return card;
  }

  function connCol(count, dir) {
    const c = el('div', `b-conn ${dir}`);
    for (let i = 0; i < count; i++) c.appendChild(el('div', 'elbow'));
    return c;
  }
  const straight = () => { const c = el('div', 'b-conn-straight'); c.appendChild(el('i')); return c; };

  function roundCol(matches, colCls, label) {
    const col = el('div', `b-col ${colCls}${matches.length <= 1 ? ' center-round' : ''}`);
    col.appendChild(el('div', 'b-round-label', label));
    matches.forEach(m => col.appendChild(koCard(m)));
    return col;
  }

  function buildBracket() {
    const root = $('#bracket-root');
    const ko = (round, side) => D.KO.filter(m => m.round === round && m.side === side);

    const center = el('div', 'b-col b-col-c');
    center.innerHTML = `
      <div class="b-champ" id="champ-box">
        <svg class="trophy" width="68" height="68" viewBox="0 0 24 24" fill="none" stroke="#e8b84b" stroke-width="1.3"><path d="M7 4h10v4a5 5 0 0 1-10 0V4z"></path><path d="M7 5H4v2a3 3 0 0 0 3 3"></path><path d="M17 5h3v2a3 3 0 0 1-3 3"></path><path d="M12 13v3"></path><path d="M9.5 20h5"></path><path d="M10 16.5h4V20h-4z"></path></svg>
        <div class="b-champ-label">WORLD CHAMPIONS</div>
        <div class="b-champ-team"><img alt=""><span></span></div>
      </div>
      <div class="final-card" id="M104">
        <div class="final-head">
          <div class="f-title">FINAL</div>
          <div class="f-sub" id="final-sub">M104 · 20 JUL · NEW YORK / NJ</div>
        </div>
        <div class="final-body">
          <div class="ko-row" data-side="0"><span class="seal"></span><span class="ko-name placeholder">W M101</span><span class="ko-score"></span></div>
          <div class="final-vs">VS</div>
          <div class="ko-row" data-side="1"><span class="seal"></span><span class="ko-name placeholder">W M102</span><span class="ko-score"></span></div>
        </div>
      </div>
      <div class="third-card" id="M103">
        <div class="tp-head">THIRD PLACE · M103 · 19 JUL</div>
        <div class="tp-row">
          <span class="tp-name placeholder" data-side="0">L M101</span>
          <span class="tp-score" data-side="0"></span>
          <span class="tp-v">V</span>
          <span class="tp-score" data-side="1"></span>
          <span class="tp-name placeholder" data-side="1">L M102</span>
        </div>
      </div>`;

    root.append(
      roundCol(ko('R32', 'L'), 'b-col-32', 'ROUND OF 32'), connCol(4, 'to-r'),
      roundCol(ko('R16', 'L'), 'b-col-16', 'ROUND OF 16'), connCol(2, 'to-r'),
      roundCol(ko('QF', 'L'), 'b-col-qf', 'QUARTER-FINALS'), connCol(1, 'to-r'),
      roundCol(ko('SF', 'L'), 'b-col-sf', 'SEMI-FINALS'), straight(),
      center,
      straight(), roundCol(ko('SF', 'R'), 'b-col-sf', 'SEMI-FINALS'),
      connCol(1, 'to-l'), roundCol(ko('QF', 'R'), 'b-col-qf', 'QUARTER-FINALS'),
      connCol(2, 'to-l'), roundCol(ko('R16', 'R'), 'b-col-16', 'ROUND OF 16'),
      connCol(4, 'to-l'), roundCol(ko('R32', 'R'), 'b-col-32', 'ROUND OF 32')
    );
  }

  /* ---------------- build: group cards ---------------- */
  function buildGroups() {
    const grid = $('#groups-grid');
    for (const [g, codes] of Object.entries(D.GROUPS)) {
      const card = el('article', 'group-card');
      card.id = `group-${g}`;
      const fixtures = D.GROUP_FIXTURES.filter(f => f.group === g);
      card.innerHTML = `
        <div class="g-head"><div class="g-tag">GROUP ${g}</div><div class="g-sub">STANDINGS</div></div>
        <div class="g-body">
          <div class="st-grid-head"><div class="team-col">TEAM</div><div>P</div><div>W</div><div>D</div><div>L</div><div>PTS</div></div>
          <div class="st-rows">
            ${codes.map(c => `
              <div class="st-row" data-code="${c}">
                <div class="st-team"><img src="${D.flag(c)}" alt="" loading="lazy"><span>${D.TEAMS[c].name}</span></div>
                <div class="st-cell" data-k="p"></div><div class="st-cell" data-k="w"></div>
                <div class="st-cell" data-k="d"></div><div class="st-cell" data-k="l"></div>
                <div class="st-cell pts" data-k="pts"></div>
              </div>`).join('')}
          </div>
          <div class="fx-label">FIXTURES &nbsp;<span>· SGT</span></div>
          ${fixtures.map(fx => `
            <div class="fx-row" id="fx-${fx.id}">
              <div class="fx-when"><div class="d">${fx.d}</div><div class="t">${fx.t}</div></div>
              <span class="fx-teams">${D.TEAMS[fx.a].name} <span class="v">v</span> ${D.TEAMS[fx.b].name}</span>
              <div class="fx-score"><b data-side="0"></b><b data-side="1"></b></div>
            </div>`).join('')}
        </div>`;
      grid.appendChild(card);
    }
  }

  /* ---------------- patch helpers ---------------- */
  function setScore(node, val, key) {
    const txt = val == null ? '' : String(val);
    if (node.textContent !== txt) {
      node.textContent = txt;
      if (txt !== '' && prevScores[key] !== undefined) {
        node.classList.remove('pop');
        void node.offsetWidth; // restart animation
        node.classList.add('pop');
      }
    }
  }

  /* ---------------- update: group fixtures + tables ---------------- */
  function updateGroups(snap) {
    for (const fx of D.GROUP_FIXTURES) {
      const st = snap.states[fx.id];
      const row = $(`#fx-${fx.id}`);
      if (!row || !st) continue;
      const live = st.status === 'live' || st.status === 'ht';
      row.classList.toggle('is-live', live);
      const when = $('.fx-when', row);
      if (live) {
        when.innerHTML = `<div class="d">${fx.d}</div><div class="live-min">${st.status === 'ht' ? 'HT' : st.minute + '′'}</div>`;
      } else if (when.querySelector('.live-min')) {
        when.innerHTML = `<div class="d">${fx.d}</div><div class="t">${fx.t}</div>`;
      }
      const boxes = row.querySelectorAll('.fx-score b');
      setScore(boxes[0], st.sa, fx.id);
      setScore(boxes[1], st.sb, fx.id);
      prevScores[fx.id] = `${st.sa}-${st.sb}`;
    }

    for (const [g, rows] of Object.entries(snap.standings)) {
      const wrap = $(`#group-${g} .st-rows`);
      if (!wrap) continue;
      const order = rows.map(r => r.code).join(',');
      const reordered = prevOrder[g] !== undefined && prevOrder[g] !== order;
      rows.forEach(r => {
        const rowEl = wrap.querySelector(`.st-row[data-code="${r.code}"]`);
        if (!rowEl) return;
        wrap.appendChild(rowEl); // append in rank order
        const filled = r.p > 0;
        ['p', 'w', 'd', 'l', 'pts'].forEach(k => {
          rowEl.querySelector(`[data-k="${k}"]`).textContent = filled ? r[k] : '';
        });
        rowEl.classList.toggle('qualified', snap.allGroupsDone && r.rank <= 2);
        if (reordered) {
          rowEl.classList.remove('moved');
          void rowEl.offsetWidth;
          rowEl.classList.add('moved');
        }
      });
      prevOrder[g] = order;
    }
  }

  /* ---------------- update: knockout bracket ---------------- */
  function fillKoRow(row, code, st, side, isWinnerKnown) {
    const name = row.querySelector('.ko-name');
    const scoreBox = row.querySelector('.ko-score');
    if (code) {
      const seal = row.querySelector('.seal');
      if (seal) {
        const img = el('img', 'flagchip');
        img.src = D.flag(code);
        img.alt = '';
        seal.replaceWith(img);
      }
      if (name.classList.contains('placeholder')) {
        name.classList.remove('placeholder');
        name.textContent = D.TEAMS[code].name;
      }
    }
    if (st && st.sa != null) {
      const val = side === 0 ? st.sa : st.sb;
      const pens = side === 0 ? st.pensA : st.pensB;
      const txt = pens != null ? `${val}<span class="pens">(${pens})</span>` : String(val);
      if (scoreBox.dataset.v !== txt) {
        scoreBox.innerHTML = txt;
        scoreBox.dataset.v = txt;
        scoreBox.firstChild && scoreBox.classList.remove('pop');
        void scoreBox.offsetWidth;
        scoreBox.classList.add('pop');
      }
    }
    if (isWinnerKnown && code) {
      row.classList.toggle('winner', st.winner === code);
      row.classList.toggle('loser', st.winner !== code);
    }
  }

  function updateBracket(snap) {
    for (const m of D.KO) {
      const card = document.getElementById(m.id);
      if (!card) continue;
      const st = snap.states[m.id];
      const teams = snap.teams[m.id] || [null, null];
      const live = st && (st.status === 'live' || st.status === 'ht');
      card.classList.toggle('is-live', !!live);

      if (m.round === 'TP') {
        [0, 1].forEach(i => {
          const nameEl = card.querySelector(`.tp-name[data-side="${i}"]`);
          const scoreEl = card.querySelector(`.tp-score[data-side="${i}"]`);
          if (teams[i] && nameEl.classList.contains('placeholder')) {
            nameEl.classList.remove('placeholder');
            nameEl.textContent = D.TEAMS[teams[i]].name;
          }
          if (st && st.sa != null) scoreEl.textContent = i === 0 ? st.sa : st.sb;
        });
        continue;
      }

      const headR = card.querySelector('.kh-r, .f-sub');
      if (headR) {
        if (live) {
          const min = st.status === 'ht' ? 'HT' : `${st.minute}′`;
          headR.innerHTML = `<span class="live-tag">● LIVE ${min}</span>`;
        } else if (headR.querySelector('.live-tag')) {
          headR.textContent = m.round === 'F' ? 'M104 · 20 JUL · NEW YORK / NJ' : `${m.d} · ${m.t}`;
        }
      }

      const ft = st && st.status === 'ft' && st.winner;
      card.querySelectorAll('.ko-row').forEach((row, i) => {
        fillKoRow(row, teams[i], st, i, !!ft);
      });
    }

    const champBox = $('#champ-box');
    if (snap.champion && champBox && !champBox.classList.contains('crowned')) {
      champBox.classList.add('crowned');
      const t = champBox.querySelector('.b-champ-team');
      t.querySelector('img').src = D.flag(snap.champion);
      t.querySelector('span').textContent = D.TEAMS[snap.champion].name;
      if (!crowned) { crowned = true; WC.fx.confetti(); }
    } else if (!snap.champion && champBox) {
      champBox.classList.remove('crowned');
      crowned = false;
    }
  }

  /* ---------------- live-now strip ---------------- */
  function liveCard(fx, st, label) {
    const live = st.status === 'live' || st.status === 'ht';
    const minTxt = live ? (st.status === 'ht' ? 'HT' : `${st.minute}′ LIVE`) :
      st.status === 'ft' ? 'FULL TIME' : `${fx.d} · ${fx.t} SGT`;
    const minCls = live ? '' : st.status === 'ft' ? ' ft' : ' pre';
    const score = st.sa == null ? '<span class="colon">VS</span>' :
      `${st.sa}<span class="colon"> : </span>${st.sb}`;
    return `
      <div class="live-card${live ? ' is-live' : ''}">
        <div class="lc-head"><span>${label}</span><span class="lc-min${minCls}">${minTxt}</span></div>
        <div class="lc-body">
          <div class="lc-team"><img src="${D.flag(fx.a)}" alt=""><span class="nm">${D.TEAMS[fx.a].name}</span></div>
          <div class="lc-score">${score}</div>
          <div class="lc-team"><img src="${D.flag(fx.b)}" alt=""><span class="nm">${D.TEAMS[fx.b].name}</span></div>
        </div>
      </div>`;
  }

  function allPlayable(snap) {
    const list = D.GROUP_FIXTURES.map(fx => ({ fx, label: `GROUP ${fx.group}` }));
    for (const m of D.KO) {
      const t = snap.teams[m.id];
      if (t && t[0] && t[1]) {
        list.push({ fx: { id: m.id, a: t[0], b: t[1], d: m.d, t: m.t, ts: m.ts }, label: m.id });
      }
    }
    return list;
  }

  function updateLiveNow(snap) {
    const root = $('#live-strip');
    const items = allPlayable(snap);
    const live = items.filter(i => {
      const st = snap.states[i.fx.id];
      return st && (st.status === 'live' || st.status === 'ht');
    });

    let html;
    if (live.length) {
      html = live.slice(0, 6).map(i => liveCard(i.fx, snap.states[i.fx.id], i.label)).join('');
    } else {
      const upcoming = items
        .filter(i => snap.states[i.fx.id] && snap.states[i.fx.id].status === 'pre' && i.fx.ts > snap.now)
        .sort((a, b) => a.fx.ts - b.fx.ts)
        .slice(0, 3);
      if (upcoming.length) {
        html = `<div class="live-empty">NO MATCH IN PLAY — <b>UP NEXT</b></div>` +
          upcoming.map(i => liveCard(i.fx, snap.states[i.fx.id], i.label)).join('');
      } else {
        html = `<div class="live-empty">TOURNAMENT COMPLETE — <b>SEE THE BRACKET FOR THE CHAMPION</b></div>`;
      }
    }
    if (root.dataset.html !== html) {
      root.innerHTML = html;
      root.dataset.html = html;
    }
  }

  /* ---------------- ticker ---------------- */
  function updateTicker(snap) {
    const root = $('#ticker');
    const items = allPlayable(snap);
    const withState = items
      .map(i => ({ ...i, st: snap.states[i.fx.id] }))
      .filter(i => i.st);

    const lives = withState.filter(i => i.st.status === 'live' || i.st.status === 'ht');
    const finished = withState.filter(i => i.st.status === 'ft')
      .sort((a, b) => b.fx.ts - a.fx.ts).slice(0, 8);
    const upcoming = withState.filter(i => i.st.status === 'pre' && i.fx.ts > snap.now)
      .sort((a, b) => a.fx.ts - b.fx.ts).slice(0, 8);

    const item = (i) => {
      const { fx, st } = i;
      const fa = `<img src="${D.flag(fx.a)}" alt="">`, fb = `<img src="${D.flag(fx.b)}" alt="">`;
      if (st.status === 'live' || st.status === 'ht') {
        return `<span class="ticker-item"><span class="t-live">● ${st.status === 'ht' ? 'HT' : st.minute + '′'}</span>${fa}${D.TEAMS[fx.a].name}<span class="t-score">${st.sa} – ${st.sb}</span>${D.TEAMS[fx.b].name}${fb}</span>`;
      }
      if (st.status === 'ft') {
        return `<span class="ticker-item">FT ${fa}${D.TEAMS[fx.a].name}<span class="t-score">${st.sa} – ${st.sb}</span>${D.TEAMS[fx.b].name}${fb}</span>`;
      }
      return `<span class="ticker-item"><span class="t-time">${fx.d} · ${fx.t}</span>${fa}${D.TEAMS[fx.a].name} v ${D.TEAMS[fx.b].name}${fb}</span>`;
    };

    const seq = [...lives, ...upcoming, ...finished];
    const html = seq.length
      ? seq.map(item).join('') + seq.map(item).join('')   // duplicated for seamless marquee
      : `<span class="ticker-item">FIFA WORLD CUP 2026 · USA · CANADA · MEXICO · JUN 12 – JUL 20</span>`.repeat(8);
    if (root.dataset.html !== html) {
      root.innerHTML = html;
      root.dataset.html = html;
    }
  }

  /* ---------------- public ----------------
     build() is also the reset path: a mode switch can move the
     tournament "back in time", so all dynamic DOM and caches
     are rebuilt from scratch. */
  function build() {
    $('#bracket-root').innerHTML = '';
    $('#groups-grid').innerHTML = '';
    const strip = $('#live-strip'), tick = $('#ticker');
    delete strip.dataset.html; delete tick.dataset.html;
    prevScores = {};
    prevOrder = {};
    crowned = false;
    buildBracket();
    buildGroups();
  }

  function update(snap) {
    updateGroups(snap);
    updateBracket(snap);
    updateLiveNow(snap);
    updateTicker(snap);
  }

  return { build, update };
})();
