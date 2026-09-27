// Frontend API wrapper for POST /api/analyze
// The Vite proxy rewrites /api/* → http://localhost:3001, so no port needed here.

// ─── Shared types (mirrors backend response) ─────────────────────────────────

export interface AnalyzePayload {
  title: string
  question: string
  goal: string
  domain: string
  context: string
}

export interface AnalyzeResult {
  summary: string
  researchType:  'comparison' | 'single'
  sources:       Array<{ id: string; label: string; url?: string }>
  evidence:      Array<{ id: string; text: string; category: string }>
  findings:      Array<{ id: string; title: string; summary: string; category: 'main-factor' | 'use-case' | 'limitation' | 'alternative' | 'impact' | 'discovery'; tags: string[] }>
  relationships: Array<{ from: string; to: string; label: string }>
  insights:      Array<{ metric: string; valueA: number; valueB: number; labelA: string; labelB: string }>
}

// ─── API call ─────────────────────────────────────────────────────────────────

export async function analyzeResearch(payload: AnalyzePayload): Promise<AnalyzeResult> {
  const res = await fetch('/api/analyze', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  })

  const data = await res.json().catch(() => ({})) as { error?: unknown }
  if (!res.ok) {
    const message = typeof data.error === 'string' ? data.error : `/api/analyze failed with status ${res.status}`
    throw new Error(message)
  }

  return data as AnalyzeResult
}
