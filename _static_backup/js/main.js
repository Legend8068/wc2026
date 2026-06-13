/* ============================================================
   WC2026 — App bootstrap & clocks
   Two modes, toggled from the nav badge:
     LIVE — real wall-clock; scores polled from the live feed.
            If the feed is unreachable/empty, the same clock
            drives the deterministic simulation instead
            (badge reads "SIM").
     DEMO — fast-forward virtual clock from kickoff day one;
            the whole tournament plays itself out in ~30 min.
   ============================================================ */
(() => {
  const D = WC.data;

  const DEMO_SPEED = 1800;                 // 1 real second = 30 virtual minutes
  const LIVE_POLL_MS = 60000;              // live feed poll interval
  const TICK_MS = 500;

  let mode = 'live';                       // 'live' | 'demo'
  let liveStates = null;                   // mapped feed data (LIVE mode)
  let feedOk = false;
  let demoStart = null;                    // real ms when demo began
  let pollTimer = null;

  const badge = document.getElementById('modeToggle');
  const badgeText = document.getElementById('modeText');
  const clockEl = document.getElementById('clock');

  const virtualNow = () =>
    mode === 'demo'
      ? D.TOURNAMENT_START - 30 * 60000 + (Date.now() - demoStart) * DEMO_SPEED
      : Date.now();

  /* ---------- mode handling ---------- */
  function setBadge() {
    badge.classList.toggle('demo', mode === 'demo');
    badgeText.textContent =
      mode === 'demo' ? 'DEMO ×1800' : feedOk ? 'LIVE' : 'LIVE · SIM';
    badge.title =
      mode === 'demo'
        ? 'Fast-forward simulation of the whole tournament. Click for live mode.'
        : feedOk
          ? 'Real scores from the live feed. Click for demo mode.'
          : 'Live feed unavailable — simulating at the real clock. Click for demo mode.';
  }

  async function poll() {
    try {
      liveStates = await WC.live.fetchStates();
      feedOk = true;
    } catch (err) {
      liveStates = null;
      feedOk = false;
    }
    setBadge();
  }

  function setMode(m, initial) {
    mode = m;
    clearInterval(pollTimer);
    pollTimer = null;
    if (!initial) WC.ui.build();   // a mode switch can rewind time — rebuild
    if (mode === 'demo') {
      demoStart = Date.now();
    } else {
      poll();
      pollTimer = setInterval(poll, LIVE_POLL_MS);
    }
    setBadge();
  }

  badge.addEventListener('click', () => setMode(mode === 'live' ? 'demo' : 'live'));

  /* ---------- clock readout (SGT, matching the chart) ---------- */
  const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  function fmtClock(ms) {
    const d = new Date(ms + 8 * 3600000); // shift to SGT, read as UTC
    const pad = (n) => String(n).padStart(2, '0');
    return `${MONTHS[d.getUTCMonth()]} ${pad(d.getUTCDate())} · ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} SGT`;
  }

  /* ---------- main loop ---------- */
  function tick() {
    const now = virtualNow();
    const useLive = mode === 'live' && feedOk && liveStates;
    const snap = WC.engine.snapshot(now, useLive ? 'live' : 'sim', liveStates);
    WC.ui.update(snap);
    clockEl.textContent = fmtClock(now);
  }

  /* ---------- boot ---------- */
  WC.ui.build();
  WC.fx.init();
  setMode('live', true);
  tick();
  setInterval(tick, TICK_MS);
})();
