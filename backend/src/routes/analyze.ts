import { Request, Response, Router } from 'express'
import { classifyResearchType } from '../lib/researchType'
import { buildFallbackResearch, generateResearch } from '../lib/gemini'

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
    const researchType = classifyResearchType(input.title, input.question)
    return res.status(200).json({
      ...buildFallbackResearch(input, researchType),
      researchType,
      analysisMode: 'fallback-preview',
    })
  }
})

export default router
