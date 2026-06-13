/* ============================================================
   WC2026 — Tournament data
   Teams, groups, fixtures and knockout structure, taken from
   the Claude Design handoff bundle (FIFA schedule, SGT times).
   ============================================================ */
window.WC = window.WC || {};

WC.data = (() => {
  // str = rough strength rating used only by the simulation engine
  const TEAMS = {
    MEX: { name: 'Mexico',         iso: 'mx',     str: 79 },
    RSA: { name: 'South Africa',   iso: 'za',     str: 68 },
    KOR: { name: 'South Korea',    iso: 'kr',     str: 77 },
    CZE: { name: 'Czechia',        iso: 'cz',     str: 75 },
    CAN: { name: 'Canada',         iso: 'ca',     str: 76 },
    BIH: { name: 'Bosnia & Herz.', iso: 'ba',     str: 70 },
    QAT: { name: 'Qatar',          iso: 'qa',     str: 66 },
    SUI: { name: 'Switzerland',    iso: 'ch',     str: 80 },
    BRA: { name: 'Brazil',         iso: 'br',     str: 92 },
    MAR: { name: 'Morocco',        iso: 'ma',     str: 84 },
    HAI: { name: 'Haiti',          iso: 'ht',     str: 58 },
    SCO: { name: 'Scotland',       iso: 'gb-sct', str: 73 },
    USA: { name: 'United States',  iso: 'us',     str: 80 },
    PAR: { name: 'Paraguay',       iso: 'py',     str: 75 },
    AUS: { name: 'Australia',      iso: 'au',     str: 74 },
    TUR: { name: 'Türkiye',        iso: 'tr',     str: 78 },
    GER: { name: 'Germany',        iso: 'de',     str: 88 },
    CUW: { name: 'Curaçao',        iso: 'cw',     str: 60 },
    CIV: { name: 'Côte d’Ivoire',  iso: 'ci',     str: 74 },
    ECU: { name: 'Ecuador',        iso: 'ec',     str: 78 },
    NED: { name: 'Netherlands',    iso: 'nl',     str: 88 },
    JPN: { name: 'Japan',          iso: 'jp',     str: 82 },
    SWE: { name: 'Sweden',         iso: 'se',     str: 75 },
    TUN: { name: 'Tunisia',        iso: 'tn',     str: 71 },
    BEL: { name: 'Belgium',        iso: 'be',     str: 84 },
    EGY: { name: 'Egypt',          iso: 'eg',     str: 72 },
    IRN: { name: 'Iran',           iso: 'ir',     str: 74 },
    NZL: { name: 'New Zealand',    iso: 'nz',     str: 62 },
    ESP: { name: 'Spain',          iso: 'es',     str: 93 },
    CPV: { name: 'Cape Verde',     iso: 'cv',     str: 59 },
    KSA: { name: 'Saudi Arabia',   iso: 'sa',     str: 68 },
    URU: { name: 'Uruguay',        iso: 'uy',     str: 82 },
    FRA: { name: 'France',         iso: 'fr',     str: 93 },
    SEN: { name: 'Senegal',        iso: 'sn',     str: 78 },
    IRQ: { name: 'Iraq',           iso: 'iq',     str: 63 },
    NOR: { name: 'Norway',         iso: 'no',     str: 81 },
    ARG: { name: 'Argentina',      iso: 'ar',     str: 94 },
    ALG: { name: 'Algeria',        iso: 'dz',     str: 75 },
    AUT: { name: 'Austria',        iso: 'at',     str: 79 },
    JOR: { name: 'Jordan',         iso: 'jo',     str: 64 },
    POR: { name: 'Portugal',       iso: 'pt',     str: 89 },
    COD: { name: 'DR Congo',       iso: 'cd',     str: 66 },
    UZB: { name: 'Uzbekistan',     iso: 'uz',     str: 65 },
    COL: { name: 'Colombia',       iso: 'co',     str: 83 },
    ENG: { name: 'England',        iso: 'gb-eng', str: 90 },
    CRO: { name: 'Croatia',        iso: 'hr',     str: 83 },
    GHA: { name: 'Ghana',          iso: 'gh',     str: 72 },
    PAN: { name: 'Panama',         iso: 'pa',     str: 67 }
  };

  const flag = (code) => `https://flagcdn.com/w160/${TEAMS[code].iso}.png`;

  const GROUPS = {
    A: ['MEX', 'RSA', 'KOR', 'CZE'],
    B: ['CAN', 'BIH', 'QAT', 'SUI'],
    C: ['BRA', 'MAR', 'HAI', 'SCO'],
    D: ['USA', 'PAR', 'AUS', 'TUR'],
    E: ['GER', 'CUW', 'CIV', 'ECU'],
    F: ['NED', 'JPN', 'SWE', 'TUN'],
    G: ['BEL', 'EGY', 'IRN', 'NZL'],
    H: ['ESP', 'CPV', 'KSA', 'URU'],
    I: ['FRA', 'SEN', 'IRQ', 'NOR'],
    J: ['ARG', 'ALG', 'AUT', 'JOR'],
    K: ['POR', 'COD', 'UZB', 'COL'],
    L: ['ENG', 'CRO', 'GHA', 'PAN']
  };

  // All times are SGT (UTC+8), dd.mm of 2026 — exactly as in the wall chart.
  const SGT_OFFSET_H = 8;
  const ts = (d, t) => {
    const [dd, mm] = d.split('.').map(Number);
    const [hh, mi] = t.split(':').map(Number);
    return Date.UTC(2026, mm - 1, dd, hh - SGT_OFFSET_H, mi);
  };

  const RAW_FIXTURES = {
    A: [['12.06','03:00','MEX','RSA'],['12.06','10:00','KOR','CZE'],['19.06','00:00','CZE','RSA'],['19.06','09:00','MEX','KOR'],['25.06','09:00','CZE','MEX'],['25.06','09:00','RSA','KOR']],
    B: [['13.06','03:00','CAN','BIH'],['14.06','03:00','QAT','SUI'],['19.06','03:00','SUI','BIH'],['19.06','06:00','CAN','QAT'],['25.06','03:00','SUI','CAN'],['25.06','03:00','BIH','QAT']],
    C: [['14.06','06:00','BRA','MAR'],['14.06','09:00','HAI','SCO'],['20.06','06:00','SCO','MAR'],['20.06','09:00','BRA','HAI'],['25.06','06:00','SCO','BRA'],['25.06','06:00','MAR','HAI']],
    D: [['13.06','09:00','USA','PAR'],['14.06','12:00','AUS','TUR'],['20.06','03:00','USA','AUS'],['20.06','12:00','TUR','PAR'],['26.06','10:00','TUR','USA'],['26.06','10:00','PAR','AUS']],
    E: [['15.06','01:00','GER','CUW'],['15.06','07:00','CIV','ECU'],['21.06','04:00','GER','CIV'],['21.06','08:00','ECU','CUW'],['26.06','04:00','CUW','CIV'],['26.06','04:00','ECU','GER']],
    F: [['15.06','04:00','NED','JPN'],['15.06','10:00','SWE','TUN'],['21.06','01:00','NED','SWE'],['21.06','12:00','TUN','JPN'],['26.06','07:00','JPN','SWE'],['26.06','07:00','TUN','NED']],
    G: [['16.06','03:00','BEL','EGY'],['16.06','09:00','IRN','NZL'],['22.06','03:00','BEL','IRN'],['22.06','09:00','NZL','EGY'],['27.06','11:00','NZL','BEL'],['27.06','11:00','EGY','IRN']],
    H: [['16.06','00:00','ESP','CPV'],['16.06','06:00','KSA','URU'],['22.06','00:00','ESP','KSA'],['22.06','06:00','URU','CPV'],['27.06','08:00','URU','ESP'],['27.06','08:00','CPV','KSA']],
    I: [['17.06','03:00','FRA','SEN'],['17.06','06:00','IRQ','NOR'],['23.06','05:00','FRA','IRQ'],['23.06','08:00','NOR','SEN'],['27.06','03:00','NOR','FRA'],['27.06','03:00','SEN','IRQ']],
    J: [['17.06','09:00','ARG','ALG'],['17.06','12:00','AUT','JOR'],['23.06','01:00','ARG','AUT'],['23.06','11:00','JOR','ALG'],['28.06','10:00','JOR','ARG'],['28.06','10:00','ALG','AUT']],
    K: [['18.06','01:00','POR','COD'],['18.06','10:00','UZB','COL'],['24.06','01:00','POR','UZB'],['24.06','10:00','COL','COD'],['28.06','07:30','COL','POR'],['28.06','07:30','COD','UZB']],
    L: [['18.06','04:00','ENG','CRO'],['18.06','07:00','GHA','PAN'],['24.06','04:00','ENG','GHA'],['24.06','07:00','PAN','CRO'],['28.06','05:00','PAN','ENG'],['28.06','05:00','CRO','GHA']]
  };

  const GROUP_FIXTURES = [];
  for (const [g, rows] of Object.entries(RAW_FIXTURES)) {
    rows.forEach(([d, t, a, b], i) => {
      GROUP_FIXTURES.push({ id: `${g}${i + 1}`, group: g, d, t, a, b, ts: ts(d, t) });
    });
  }

  // Knockout slot sources.
  //   {w:'A'}  → group A winner       {r:'B'}  → group B runner-up
  //   {t:n}    → nth-ranked best third-placed team (1–8)
  //   {win:'M73'} / {lose:'M101'} → winner / loser of an earlier match
  // NOTE: provisional bracket mapping (the official 48-team R32 seeding
  // depends on FIFA's final allocation) — adjust here if needed.
  const KO = [
    { id:'M73',  round:'R32', side:'L', d:'29.06', t:'03:00', src:[{w:'A'},{t:1}] },
    { id:'M74',  round:'R32', side:'L', d:'30.06', t:'01:00', src:[{w:'C'},{t:2}] },
    { id:'M75',  round:'R32', side:'L', d:'30.06', t:'04:30', src:[{w:'E'},{t:3}] },
    { id:'M76',  round:'R32', side:'L', d:'30.06', t:'09:00', src:[{w:'G'},{t:4}] },
    { id:'M77',  round:'R32', side:'L', d:'01.07', t:'01:00', src:[{r:'B'},{r:'D'}] },
    { id:'M78',  round:'R32', side:'L', d:'01.07', t:'05:00', src:[{r:'F'},{r:'H'}] },
    { id:'M79',  round:'R32', side:'L', d:'01.07', t:'09:00', src:[{w:'I'},{t:5}] },
    { id:'M80',  round:'R32', side:'L', d:'02.07', t:'00:00', src:[{r:'J'},{r:'L'}] },
    { id:'M81',  round:'R32', side:'R', d:'02.07', t:'04:00', src:[{w:'B'},{t:6}] },
    { id:'M82',  round:'R32', side:'R', d:'02.07', t:'08:00', src:[{w:'D'},{t:7}] },
    { id:'M83',  round:'R32', side:'R', d:'03.07', t:'03:00', src:[{w:'F'},{t:8}] },
    { id:'M84',  round:'R32', side:'R', d:'03.07', t:'07:00', src:[{w:'H'},{r:'C'}] },
    { id:'M85',  round:'R32', side:'R', d:'03.07', t:'11:00', src:[{w:'J'},{r:'E'}] },
    { id:'M86',  round:'R32', side:'R', d:'04.07', t:'02:00', src:[{w:'K'},{r:'I'}] },
    { id:'M87',  round:'R32', side:'R', d:'04.07', t:'06:00', src:[{w:'L'},{r:'G'}] },
    { id:'M88',  round:'R32', side:'R', d:'04.07', t:'09:30', src:[{r:'K'},{r:'A'}] },
    { id:'M89',  round:'R16', side:'L', d:'05.07', t:'01:00', src:[{win:'M73'},{win:'M74'}] },
    { id:'M90',  round:'R16', side:'L', d:'05.07', t:'05:00', src:[{win:'M75'},{win:'M76'}] },
    { id:'M91',  round:'R16', side:'L', d:'06.07', t:'04:00', src:[{win:'M77'},{win:'M78'}] },
    { id:'M92',  round:'R16', side:'L', d:'06.07', t:'08:00', src:[{win:'M79'},{win:'M80'}] },
    { id:'M93',  round:'R16', side:'R', d:'07.07', t:'03:00', src:[{win:'M81'},{win:'M82'}] },
    { id:'M94',  round:'R16', side:'R', d:'07.07', t:'08:00', src:[{win:'M83'},{win:'M84'}] },
    { id:'M95',  round:'R16', side:'R', d:'08.07', t:'00:00', src:[{win:'M85'},{win:'M86'}] },
    { id:'M96',  round:'R16', side:'R', d:'08.07', t:'04:00', src:[{win:'M87'},{win:'M88'}] },
    { id:'M97',  round:'QF',  side:'L', d:'10.07', t:'04:00', src:[{win:'M89'},{win:'M90'}] },
    { id:'M98',  round:'QF',  side:'L', d:'11.07', t:'03:00', src:[{win:'M91'},{win:'M92'}] },
    { id:'M99',  round:'QF',  side:'R', d:'12.07', t:'05:00', src:[{win:'M93'},{win:'M94'}] },
    { id:'M100', round:'QF',  side:'R', d:'12.07', t:'09:00', src:[{win:'M95'},{win:'M96'}] },
    { id:'M101', round:'SF',  side:'L', d:'15.07', t:'03:00', src:[{win:'M97'},{win:'M98'}] },
    { id:'M102', round:'SF',  side:'R', d:'16.07', t:'03:00', src:[{win:'M99'},{win:'M100'}] },
    { id:'M103', round:'TP',  side:'C', d:'19.07', t:'03:00', src:[{lose:'M101'},{lose:'M102'}] },
    { id:'M104', round:'F',   side:'C', d:'20.07', t:'03:00', src:[{win:'M101'},{win:'M102'}], venue:'NEW YORK / NJ' }
  ];
  KO.forEach(m => { m.ts = ts(m.d, m.t); });

  const srcLabel = (s) => {
    if (s.w) return `1${s.w}`;
    if (s.r) return `2${s.r}`;
    if (s.t) return `3RD · ${s.t}`;
    if (s.win) return `W ${s.win}`;
    if (s.lose) return `L ${s.lose}`;
    return '—';
  };

  const TOURNAMENT_START = ts('12.06', '03:00');
  const TOURNAMENT_END = ts('20.07', '06:00');

  return { TEAMS, GROUPS, GROUP_FIXTURES, KO, flag, ts, srcLabel, TOURNAMENT_START, TOURNAMENT_END };
})();
