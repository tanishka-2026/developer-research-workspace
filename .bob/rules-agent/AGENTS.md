# Project Coding Rules (Non-Obvious Only)

## Styling
- **Never hardcode hex colors** — declare a local `const C = { ... } as const` at the top of every new page/component and reference `C.*`.
- Inline `style={{}}` is the primary styling mechanism for layout dimensions, colors, and positioning. Tailwind classes are used only for generic layout helpers (`flex`, `items-center`, `gap-*`, etc.).
- Tailwind v4: no `tailwind.config.js`, no `content` array. Adding new design tokens requires editing `@theme {}` in `frontend/src/index.css` only.

## Animations
- Always import from `motion/react`, **not** `framer-motion`. Both packages exist in node_modules but `framer-motion` is the legacy alias.
- Wrap any conditional/toggled view with `<AnimatePresence>` or the exit animation will not fire.
- Do not add `prefers-reduced-motion` guards per component — the global CSS rule in `index.css` already collapses all durations to ~0ms.

## State
- All research data flows through `useResearch()` from `frontend/src/context/ResearchContext.tsx`.
- When writing research from the Create form, always call `buildResearch(partial)` — it fills missing fields with mock defaults so downstream pages never receive `undefined`.
- `Finding.category` must be one of: `'main-factor' | 'use-case' | 'limitation' | 'alternative' | 'impact' | 'discovery'`. Using any other string will break category-conditional rendering.

## API
- `POST /api/analyze` is the only real route. Call it via `analyzeResearch()` from `frontend/src/api/analyzeApi.ts` — do not re-implement fetch inline.
- If the backend is unreachable, fall back to `buildResearch({})` with local data (see `CreateResearch.tsx` catch block pattern).

## Backend
- Backend is CommonJS — never use top-level `await` or `import.meta` in backend files.
- To add a new route: create `backend/src/routes/<name>.ts`, export a `Router`, mount it in `backend/src/index.ts` with `app.use('/api/<name>', router)`.
- `buildMockResponse()` in `backend/src/routes/analyze.ts` is the placeholder for the watsonx.ai call — replace only this function body when integrating AI.

## Analysis canvas
- Node positions are absolute pixels within a `CW × CH` coordinate space. After moving any node, update the matching entry in the `EDGES` array too (edges are not auto-calculated).
- Do not change `CW`/`CH` unless repositioning every node and edge — they are a coupled global constant.
