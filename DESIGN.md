# WC2026 Live Tracker — Design System

The site implements the **World Cup 2026 Live Tracker** from a Claude Design
handoff bundle: a large-format poster fusing a tournament-tracker structure
with a Japanese woodblock (ukiyo-e) poster aesthetic — deep indigo ground,
washi-paper cream cards, vermilion ink, gold accents, a rising sun and a
Hokusai-style wave. The website keeps that language pixel-faithful where it
can, and extends it with motion and live-data states the print version
couldn't have.

## Palette

Defined as CSS custom properties in `css/style.css :root`. Use the tokens,
never raw hexes.

| Token | Hex | Use |
|---|---|---|
| `--indigo-deep` | `#0a1730` | page ground (radial gradient base) |
| `--indigo` | `#0e2247` | mid ground, third-place card |
| `--indigo-light` | `#15315e` | gradient top |
| `--ink` | `#11244a` | card borders, headers, all "ink" on paper |
| `--cream` | `#f4ead6` | washi card paper, light text on indigo |
| `--paper` | `#fff8ec` | fill-in boxes on cards |
| `--paper-dim` | `#f7eed8` | mon-seal field |
| `--vermilion` | `#d5372a` | rising sun, group tags, live accents |
| `--vermilion-dark` | `#ad2317` | sun shadow, 2026 drop shadow |
| `--vermilion-light` | `#e8503e` | sun highlight, live dots |
| `--gold` | `#e8b84b` | stat numbers, trophy, Final frame, football, seals |
| `--gold-soft` | `#f3d79c` | PTS cells, winner score boxes |
| `--rose` | `#e7b9b2` | secondary labels on indigo, back wave |
| `--rose-deep` | `#d98c84` | dividers/dots, front wave |
| `--rust` | `#b2402f` | "VS", fixture dates, accents on paper |
| `--tan` `--olive` `--slate` | `#a99a78` `#7a6f53` `#5d6b86` | muted ink on paper (placeholders, table headers, times) |

## Typography

Google Fonts, three voices (as in the poster):

- **Anton** (`--display`) — monumental numerals & titles: "2026", FINAL,
  section titles, scores in the match-centre cards. Never body text.
- **Oswald** (`--head`) — all-caps labels with wide tracking (0.12–0.5 em):
  nav, round labels, card headers, stats labels, ticker.
- **Barlow Condensed** (`--body`) — team names and dense data rows.

Scale is fluid (`clamp()`); the hero "2026" runs 110–240 px with
`text-shadow: 0 7px 0 var(--vermilion-dark)` and a subtle gold glow.

## Signature motifs

1. **Rising sun + sunburst** (hero): vermilion disc with radial shading and a
   `repeating-conic-gradient` ray field masked to a halo. The gold **football
   pictogram** (`assets/football-gold.svg`, from the bundle) sits centered on
   the sun.
2. **Hokusai wave** (hero base): two layered SVG wave paths in rose tones at
   45 % opacity, tileable (each path repeats its segment twice so a 200 %-wide
   layer can loop seamlessly).
3. **Washi match cards**: cream paper, 1.5 px ink border, hard offset shadow
   (`2px 3px 0 rgba(0,0,0,.22)`) — a woodblock print plate, not a soft web
   shadow. Headers are ink bars with cream Oswald type.
4. **Rising-sun mon seals**: the "awaiting its qualifier" stamp in every empty
   knockout slot — gold/cream sunburst cockade (`repeating-conic-gradient`)
   with a vermilion centre, ink ring. Replaced by the real flag (with a
   stamp-in animation) once the slot resolves.
5. **Paper grain**: a fixed full-page SVG `feTurbulence` noise overlay at 7 %
   opacity, `mix-blend-mode: overlay`.

## Layout

- **Top bar** (sticky): wordmark, anchor nav, SGT clock, mode badge.
- **Ticker**: ink marquee strip — live matches first, then upcoming, then
  recent results; pauses on hover.
- **Hero**: title block left, "tournament at a glance" 2×2 stat grid right,
  sun centered behind; wave closes the band.
- **Match centre**: responsive grid of scoreboard cards — live matches (red
  ring) or, if none, the next three kickoffs.
- **Bracket**: the poster's symmetric R32 → R16 → QF → SF columns flanking a
  centre column (trophy → gold-framed FINAL → third-place box). Connector
  elbows are bordered pseudo-elements, exactly like the prototype. Fixed
  2150 px composition inside `overflow-x: auto` — the poster is preserved, the
  page scrolls it.
- **Groups**: 12 cards, `auto-fit minmax(330px, 1fr)` (6×2 on a wide screen,
  matching the A2 landscape chart). Each card: vermilion GROUP tag + ink
  STANDINGS bar, P/W/D/L/PTS table (gold PTS column), fixtures with date,
  SGT time and two score boxes.

## Motion language

Slow and ceremonial for scenery; quick and springy for data.

| Element | Animation |
|---|---|
| Sunburst | 150 s linear rotation |
| Sun | 6 s glow breathing |
| Football | 5 s bob + slight tilt |
| Waves | two layers drifting at 36 s / 22 s (parallax) |
| Ticker | 42 s marquee, pauses on hover |
| Stats | count up from 0 on first view (eased cubic) |
| Sections | fade-up scroll reveal (`.reveal` + IntersectionObserver) |
| Live match | pulsing dot, blinking minute, expanding red ring on cards |
| Score change | `score-pop` — 1.45× overshoot scale flash |
| Flag fills | `chip-in` — scale/rotate stamp-in when a bracket slot resolves |
| Standings | `row-glow` gold flash when a team changes rank |
| Final live | gold glow breathing on the Final card |
| Champion | trophy shine loop; crowned team stamps in; gold/vermilion confetti |

All scenery animation is disabled under `prefers-reduced-motion: reduce`.

## Data states (what print couldn't do)

- Score boxes are **blank** (`null`) before kickoff — the fill-in-chart look
  is the genuine pre-match state.
- Live: red left-rule + minute on group fixtures; `● LIVE 67′` replaces the
  date in knockout card headers.
- Finished knockouts: winner row bold with gold score box, loser at 55 %
  opacity, penalties as small `(4)` superscripts.
- Group standings fill and re-sort live; top two get a gold qualification
  rule once the group is decided.
- When the Final ends, the champion's flag and name appear under the trophy.

## Responsiveness & a11y

- Fluid type via `clamp()` everywhere; hero stacks under 900 px; group grid
  collapses to one column under 520 px; bracket always scrolls horizontally.
- The chart reads in SGT (UTC+8) everywhere, as the poster does — the nav
  clock makes the reference timezone explicit.
- Semantic landmarks (`nav/header/section/article/footer`), alt-text-free
  decorative imagery (`alt=""`), focusable mode toggle, reduced-motion
  support.
