# Project Documentation Context (Non-Obvious Only)

## Code is the canonical reference — docs may lag
- The real type shapes for `Research`, `Finding`, `Source`, `Evidence`, `Insight`, `Relationship` live in `frontend/src/context/ResearchContext.tsx` — not in any markdown doc.
- The backend mirrors these types locally in `backend/src/routes/analyze.ts` (they are duplicated, not shared via a package).

## File layout surprises
- `frontend/src/api/` contains only `analyzeApi.ts` — a thin typed wrapper for `POST /api/analyze`. No other API clients exist yet.
- `frontend/src/context/` holds both the types and the mock seed data (`MOCK_FINDINGS`, `MOCK_INSIGHTS`, etc.) — not a separate fixtures file.
- There is no test directory — no tests have been written yet.

## Environment setup
- `backend/.env` is gitignored and must be created manually from `backend/env.example`.
- The four required env vars are: `IBM_CLOUD_API_KEY`, `WATSONX_PROJECT_ID`, `WATSONX_URL`, `WATSONX_MODEL_ID`.
- The backend currently ignores these env vars — `buildMockResponse()` is the placeholder until watsonx.ai is wired up.

## Vite proxy
- All `/api/*` paths in the browser are proxied to `http://localhost:3001` by Vite — there is no runtime env var for the API URL.
- This proxy only works in `npm run dev`; a production deployment needs a real reverse proxy or env-based URL.
