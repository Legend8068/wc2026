# WC2026 — Live Tracker

A World Cup 2026 live tracker website that tracks scores in real time: live group standings, a self-filling knockout bracket, a match ticker, and a fast-forward demo mode that plays the whole tournament out in ~30 minutes.

Implemented from a Claude Design handoff bundle (woodblock-poster A2 wall chart). The visual language is documented in `DESIGN.md` — read it before touching any styling.

## Architecture & Tech Stack

Originally a plain HTML/CSS/JS project, it has evolved into a **Vite-based Single Page Application (SPA)** using **React**, **Framer Motion**, and **Lottie** for rich animations and interactions.

### Key Components

*   **Frontend**: React + Vite SPA. Deployed on Vercel.
*   **Styling**: Vanilla CSS with modern interactions (CSS-driven micro-interactions, spring-like transitions, spotlight effects).
*   **Map Generation**: SVG maps are generated via Node/Python scripts (e.g., `generate_clean_sg_svg.mjs`, `patch_hostmap.py`) from GeoJSON data and rendered as React components.
*   **Backend / Serverless**: 
    *   Vercel Serverless Functions (e.g., `api/highlights.js`) fetch match highlights from YouTube (specifically Mediacorp Sports channel).
    *   Requires `YOUTUBE_API_KEY` in the environment.
*   **Deployment Configuration**: Vercel SPA routing uses `vercel.json` to explicitly handle API route rewrites, avoiding HTML collisions with serverless functions.

## Project History & Milestones

### 1. Initial Implementation
*   Built from a static woodblock-poster A2 wall chart design.
*   Implemented core tournament engine (deterministic match simulation, standings computation).
*   Added live data fetching from public scoreboards and a fast-forward DEMO mode.

### 2. Migration to React & Vite
*   Transitioned from vanilla JS namespaces (`WC.engine`, `WC.ui`, etc.) to a modern React architecture bundled with Vite.
*   Implemented chunking strategies for `react`, `framer-motion`, and `lottie-react` in `vite.config.js`.

### 3. Visual & Interactivity Enhancements
*   **Statistics Section**: Added highly interactive elements prioritizing visual excellence:
    *   Compact Player Rows with hover states.
    *   Interactive Category Tabs.
    *   Discipline Card Wall with staggered animations.
    *   Team Stat Panels with spotlight effects and spring-like transitions.
*   Fixed layout issues in Statistics cards (e.g., ensuring player names are not cut off and are fully scrollable by tuning dimensions and rows).

### 4. Vercel Infrastructure & Highlights Integration
*   Integrated a YouTube API serverless function (`api/highlights.js`) to fetch match highlights specifically from the "Mediacorp Sports" channel, matching title formats like `"Jordan 1-3 Argentina | Group J | FIFA World Cup 2026™ Highlights"`.
*   **Routing Fixes**: Addressed Vercel deployment issues where the SPA fallback (`index.html`) shadowed `/api/*` routes, causing 404s or returning HTML instead of JSON. Created `vercel.json` with explicit rewrite rules for `/api/highlights` to ensure the serverless function executes correctly.
*   Verified serverless execution locally via test scripts (`test_api_local.js`).

### 5. Knockout Stage Logic Updates
*   **Round of 32 Pairings**: Fixed logical bugs in the bracket rendering and 3rd place assignments that caused teams to be paired wrongly or visually cross over the entire screen. 
*   Hardcoded the official FIFA 495-combination matrix logic for the real-world 2026 World Cup Round of 32 (mapping the specific B, D, E, F, I, J, K, L outcome) to perfectly align with live ESPN data streams.

## Running Locally

```sh
npm install
npm run dev
```

To test the Vercel serverless functions locally (requires `vercel` CLI):
```sh
vercel dev
```

## Conventions

- **Timezones**: Kick-off times are generally SGT (UTC+8), converted as needed.
- **Styling**: Handled via vanilla CSS utilizing CSS variables and prioritizing a premium, dynamic feel (dark mode, glassmorphism, micro-animations). Respect the `prefers-reduced-motion` block when adding animations.
- **SVGs**: When modifying SVGs (like host city maps), prefer generating path data directly rather than using inline style overrides, letting CSS handle fills and strokes.
