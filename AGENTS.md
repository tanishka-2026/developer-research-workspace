# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Project: ResearchNest

Full-stack research analysis app.
Stack: React + TypeScript + Vite + Tailwind CSS v4 (frontend) · Node.js + Express + TypeScript (backend)

## Commands

```bash
# Frontend (run from /frontend)
npm run dev       # → http://localhost:5173
npm run build     # → frontend/dist/

# Backend (run from /backend)
npm run dev       # → http://localhost:3001  (ts-node-dev, hot-reload)
npm run build     # → backend/dist/
npm start         # run compiled output
```

Both servers must run simultaneously for the `/api/*` proxy to work.

## Non-Obvious Rules

### Tailwind v4 (critical — no config file)
- Tailwind v4 is used — there is **no `tailwind.config.js`** and no `content` array.
- Configured entirely via `@theme {}` in [`frontend/src/index.css`](frontend/src/index.css).
- Plugin is `@tailwindcss/vite` (not PostCSS) — lives in [`frontend/vite.config.ts`](frontend/vite.config.ts).
- Custom tokens: `font-inter`, `font-caveat`, `color-brand-light/pale/purple/teal/blue/navy`, `color-white`.

### Styling approach
- Pages use **inline `style={{}}` for all sizing/positioning** (not Tailwind classes) — Tailwind utility classes only appear for layout helpers (`flex`, `items-center`, etc.).
- Each page/component declares a local `const C = { ... } as const` design-token object — **always use `C.*` values, never hardcode hex colors inline**.
- Strict palette: `#EAF1FC`, `#DAE8FB`, `#F2D2FF`, `#75CBD1`, `#3E5BA3`, `#0C0D45`, `#FFFFFF`.
- **Inter** for all UI text · **Caveat** (cursive) only for decorative/italic labels (e.g., the research title on the canvas bar).

### Animation
- Import from `motion/react` (not `framer-motion`) — both are installed but `motion` is the v11 package.
- Wrap view-switch transitions (e.g., Grid ↔ Bar graph in InsightsPage) with `<AnimatePresence>`.
- GSAP (`gsap`) is used for canvas/timeline path animations in [`AnalysisPage.tsx`](frontend/src/pages/AnalysisPage.tsx).
- Global `prefers-reduced-motion` override is already in `index.css` — no per-component handling needed.

### Shared state
- [`frontend/src/context/ResearchContext.tsx`](frontend/src/context/ResearchContext.tsx) is the **single source of truth** for all research data across pages.
- Use `useResearch()` hook to read/write; `buildResearch(partial)` merges user fields with mock defaults.
- `Finding.category` is a strict union: `'main-factor' | 'use-case' | 'limitation' | 'alternative' | 'impact' | 'discovery'`.

### API / backend
- Frontend fetches `/api/analyze` (POST) and `/api/health` (GET) — no port in URLs; Vite proxy handles it.
- Backend CORS is locked to `http://localhost:5173` — update [`backend/src/index.ts`](backend/src/index.ts) if port changes.
- Backend uses **CommonJS** (`"module": "commonjs"`) — avoid ESM-only patterns at runtime.
- `backend/.env` **cannot be committed** (covered by root `.gitignore`). Copy `backend/.env.example` and set `GEMINI_API_KEY`.
- `POST /api/analyze` and `POST /api/chat` use the server-side Gemini service in [`backend/src/lib/gemini.ts`](backend/src/lib/gemini.ts). Provider failures return explicit HTTP errors; do not substitute mock research.

### Analysis canvas
- Canvas nodes in [`AnalysisPage.tsx`](frontend/src/pages/AnalysisPage.tsx) use **absolute pixel positioning** inside a `div` scaled by `transform: scale(zoom)`.
- `CW = 1180` / `CH = 680` constants define the coordinate space — changing them shifts all node positions.
- Edge coordinates in the `EDGES` array are hand-tuned to match Figma node positions — update them if nodes move.

### Routes
- `/` → `LandingPage`, `/new` → `CreateResearch`, `/analysis` → `AnalysisPage`, `/insights` → `InsightsPage`, `/about` → placeholder.
- `<ResearchProvider>` wraps all routes — state persists across navigation within the session.

## What's Not Implemented Yet
- Real watsonx.ai call (swap `buildMockResponse` in `backend/src/routes/analyze.ts`)
- Auth, database, persistence
