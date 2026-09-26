# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Project: ResearchNest

Full-stack research analysis app.  
Stack: React + TypeScript + Vite (frontend) · Node.js + Express + TypeScript (backend)

## Folder Structure

```
researchnest/
├── frontend/   React + Vite app (port 5173)
├── backend/    Express API      (port 3001)
└── AGENTS.md
```

## Commands

### Frontend
```bash
cd frontend
npm install      # first time only
npm run dev      # dev server → http://localhost:5173
npm run build    # production build → frontend/dist/
```

### Backend
```bash
cd backend
npm install      # first time only
npm run dev      # dev server with auto-reload → http://localhost:3001
npm run build    # compile TypeScript → backend/dist/
npm start        # run compiled output
```

## How Frontend Talks to Backend

The Vite dev server proxies every `/api/*` request to `http://localhost:3001`.  
Config lives in [`frontend/vite.config.ts`](frontend/vite.config.ts).

So in React code, fetch like this — **no hardcoded port needed**:
```ts
const res = await fetch('/api/health')
```

This also means **both servers must be running** during development.

## Key Files

| File | Purpose |
|---|---|
| `frontend/src/App.tsx` | Root React component (placeholder for now) |
| `frontend/vite.config.ts` | Vite config — proxy rule lives here |
| `backend/src/index.ts` | Express app entry point |
| `backend/tsconfig.json` | TypeScript config for backend (`commonjs` modules) |

## Non-Obvious Rules

- Backend uses **CommonJS** (`"module": "commonjs"` in tsconfig) — use `require()`-compatible patterns; no ESM `import` at runtime.
- Frontend uses **ESM** — use `import`/`export` everywhere.
- CORS in `backend/src/index.ts` is locked to `http://localhost:5173` — update the origin if the frontend port changes.
- `ts-node-dev` (not `nodemon`) handles backend hot-reload; it transpiles TypeScript without a separate compile step.
- The health-check route is `GET /api/health` — use it to confirm connectivity before wiring up real routes.

## Planned Next Steps (not yet implemented)

- Research analysis routes (`POST /api/analyze`)
- watsonx.ai integration in the backend
- Research Map UI in the frontend
