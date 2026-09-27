import { Request, Response, Router } from 'express'
import { classifyResearchType } from '../lib/researchType'
import { generateResearch } from '../lib/gemini'

const router = Router()

interface AnalyzeRequest {
  title?: string
  question?: string
  goal?: string
  domain?: string
  context?: string
}

function stringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() || fallback : fallback
}

function getClientErrorMessage(error: unknown): string {
  const rawMessage = error instanceof Error ? error.message : String(error)

  try {
    const providerError = JSON.parse(rawMessage) as {
      error?: { code?: unknown; status?: unknown; message?: unknown }
    }
    const code = providerError.error?.code
    const status = providerError.error?.status
    const message = typeof providerError.error?.message === 'string'
      ? providerError.error.message.trim()
      : ''

    if (code === 429 || status === 'RESOURCE_EXHAUSTED') {
      return 'Gemini quota exceeded. Check the Gemini API project billing and rate limits, then try again.'
    }
    if (code === 401 || status === 'UNAUTHENTICATED') {
      return 'Gemini rejected the configured API key. Verify GEMINI_API_KEY in backend/.env.'
    }
    if (code === 403 || status === 'PERMISSION_DENIED') {
      return 'Gemini denied this request. Check API key permissions, project access, and model availability.'
    }
    if (typeof code === 'number' && message) {
      return `Gemini request failed (${code}): ${message.slice(0, 240)}`
    }
  } catch {
    // Keep non-JSON SDK errors private; detailed diagnostics remain in backend logs.
  }

  return 'Gemini could not generate this analysis. Check GEMINI_API_KEY and backend logs; no mock analysis was returned.'
}

router.post('/', async (req: Request, res: Response) => {
  const body = req.body as AnalyzeRequest
  const input = {
    title: stringValue(body?.title, 'Research topic'),
    question: stringValue(body?.question),
    goal: stringValue(body?.goal, 'Explore'),
    domain: stringValue(body?.domain, 'Technology'),
    context: stringValue(body?.context),
  }

  try {
    const result = await generateResearch(input)
    console.log('[POST /api/analyze] Gemini succeeded', {
      researchType: result.researchType,
      findings: result.findings.length,
    })
    return res.json(result)
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error)
    console.error('[POST /api/analyze] Gemini failed:', details)
    return res.status(502).json({
      code: 'GEMINI_ANALYSIS_FAILED',
      error: getClientErrorMessage(error),
      researchType: classifyResearchType(input.title, input.question),
    })
  }
})

export default router