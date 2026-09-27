# Project Architecture Rules (Non-Obvious Only)

## Data flow
- `CreateResearch` → calls `POST /api/analyze` → receives structured JSON → calls `setResearch(buildResearch(...))` → context update propagates to `AnalysisPage` and `InsightsPage`.
- If the API call fails, `CreateResearch` falls back silently to `buildResearch({})` with the user's title/domain/goal but mock findings — users see data even without a backend.
- `buildResearch(partial)` is **additive-only**: it never clears already-populated arrays. An empty `partial.findings` will be replaced with `MOCK_FINDINGS`; a non-empty one will be used as-is.

## Frontend/backend type duplication (intentional)
- Types are **duplicated** between `frontend/src/context/ResearchContext.tsx` and `backend/src/routes/analyze.ts`. There is no shared types package. Keep them in sync manually when extending the schema.

## Canvas rendering model
- `AnalysisPage` renders a static SVG for edges over a `position:relative` div containing absolutely-positioned node components.
- Zoom is implemented as CSS `transform: scale(zoom)` on the inner div — the outer container clips overflow. Node interaction coordinates do not scale — click targets remain at original pixel positions.
- `AskPanel` is a sibling of `ResearchCanvas` inside the same scaled div, not a portal.

## Analysis page is currently static
- `AnalysisPage` does **not** read `research.findings` to render node cards — nodes are hardcoded components (`MainFactorNode`, `UseCaseNode`, etc.) with static content.
- The context data is read only for `research.title`, `research.findings.length`, and the summary text in the status bar.
- Connecting context findings to dynamic node rendering is future work.

## InsightsPage toggle pattern
- The Grid ↔ Bar graph toggle uses a boolean `view` state + `<AnimatePresence mode="wait">` wrapping two `<motion.div key={view}>` — changing the key forces a full unmount/remount with exit animation.

## Backend has no middleware stack
- No auth, rate limiting, logging middleware, or error handler is registered. `express.json()` and `cors()` are the only middleware.
- Add any new route in `backend/src/routes/` and register it in `backend/src/index.ts` before the server start call.
