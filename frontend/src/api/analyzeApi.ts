// Frontend API wrapper for POST /api/analyze
// Uses the deployed Render backend in production,
// while still working with the local Vite proxy during development.

// ─── Backend URL ──────────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL || ''

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
  researchType: 'comparison' | 'single'

  sources: Array<{
    id: string
    label: string
    url?: string
  }>

  evidence: Array<{
    id: string
    text: string
    category: string
  }>

  findings: Array<{
    id: string
    title: string
    summary: string
    category:
      | 'main-factor'
      | 'use-case'
      | 'limitation'
      | 'alternative'
      | 'impact'
      | 'discovery'
    tags: string[]
  }>

  relationships: Array<{
    from: string
    to: string
    label: string
  }>

  insights: Array<{
    metric: string
    valueA: number
    valueB: number
    labelA: string
    labelB: string
  }>
}

export class AnalyzeApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly researchType?: 'single' | 'comparison'

  constructor(
    message: string,
    status: number,
    code?: string,
    researchType?: 'single' | 'comparison',
  ) {
    super(message)
    this.name = 'AnalyzeApiError'
    this.status = status
    this.code = code
    this.researchType = researchType
  }
}

// ─── API call ─────────────────────────────────────────────────────────────────

export async function analyzeResearch(
  payload: AnalyzePayload
): Promise<AnalyzeResult> {
  const res = await fetch(`${API_URL}/api/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = (await res.json().catch(() => ({}))) as {
    error?: unknown
    code?: unknown
    researchType?: unknown
  }

  if (!res.ok) {
    const message =
      typeof data.error === 'string'
        ? data.error
        : `/api/analyze failed with status ${res.status}`

    throw new AnalyzeApiError(
      message,
      res.status,
      typeof data.code === 'string' ? data.code : undefined,
      data.researchType === 'comparison' || data.researchType === 'single' ? data.researchType : undefined,
    )
  }

  return data as AnalyzeResult
}