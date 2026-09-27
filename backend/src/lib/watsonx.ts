// watsonx.ts — IBM watsonx.ai Runtime client
// Uses Node 18+ native fetch (no extra packages needed).
// All credentials stay server-side; never imported by the frontend.

import 'dotenv/config'
import { classifyResearchType } from './researchType'

// ─── IBM IAM token cache ──────────────────────────────────────────────────────
// Tokens are valid for ~1 hour. We cache and reuse to avoid hammering the IAM endpoint.

interface TokenCache {
  token: string
  expiresAt: number   // epoch ms
}

let tokenCache: TokenCache | null = null

async function getIamToken(): Promise<string> {
  const now = Date.now()
  if (tokenCache && tokenCache.expiresAt - now > 2 * 60 * 1000) {
    return tokenCache.token
  }

  const apiKey = process.env.IBM_CLOUD_API_KEY
  if (!apiKey) throw new Error('IBM_CLOUD_API_KEY is not set in .env')

  const res = await fetch('https://iam.cloud.ibm.com/identity/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
      apikey:     apiKey,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`IAM token exchange failed (${res.status}): ${body.slice(0, 200)}`)
  }

  const data = await res.json() as { access_token: string; expires_in: number }
  tokenCache = {
    token:     data.access_token,
    expiresAt: now + data.expires_in * 1000,
  }
  return tokenCache.token
}

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface WatsonxInput {
  title:    string
  question: string
  goal:     string
  domain:   string
  context:  string
}

export interface WatsonxResearchResult {
  researchType: 'comparison' | 'single'
  summary:       string
  sources:       Array<{ id: string; label: string; url?: string }>
  evidence:      Array<{ id: string; text: string; category: string }>
  findings:      Array<{
    id: string; title: string; summary: string
    category: 'main-factor' | 'use-case' | 'limitation' | 'alternative' | 'impact' | 'discovery'
    tags: string[]
  }>
  relationships: Array<{ from: string; to: string; label: string }>
  insights:      Array<{ metric: string; valueA: number; valueB: number; labelA: string; labelB: string }>
}

// ─── Prompt builder ───────────────────────────────────────────────────────────
// The prompt is written to produce topic-specific, mechanism-level content,
// not generic filler. Every instruction links back to the user's actual input.

function buildPrompt(input: WatsonxInput): string {
  const questionGuidance = input.question
    ? `\nThe user's specific research question is: "${input.question}"\nEvery finding must directly address or support this question.`
    : ''

  const contextGuidance = input.context
    ? `\nAdditional context from the user: "${input.context}"\nIncorporate this context into findings where relevant.`
    : ''

  const goalGuidance = `\nResearch goal: ${input.goal}. Frame findings and the summary to serve this goal.`

  return `You are an expert research analyst with deep knowledge across technology, science, and engineering.
Your task is to produce a structured research analysis for the topic below.
Return ONLY a valid JSON object. No markdown fences, no explanation, no text outside the JSON.
Interpret the title and question as one research request, not as separate words or subjects.
Set researchType to "comparison" only when the user's intent clearly compares at least two distinct subjects; otherwise set it to "single". A multiword topic or an instruction to explain, analyze, or research one subject is single-topic.
For comparisons, make both labels and all analysis specific to the named subjects. For single topics, label insight values as strengths and trade-offs of the topic.
${questionGuidance}
${contextGuidance}
${goalGuidance}

RESEARCH TOPIC: ${input.title}
DOMAIN: ${input.domain}

QUALITY REQUIREMENTS — READ CAREFULLY:
1. The "summary" must directly answer the research question (if provided) or describe the core insight of the topic in 2-3 sentences. No generic filler.
2. Each finding "summary" must explain a concrete mechanism, trade-off, or use case — not generic praise or criticism. Minimum 2 sentences per finding.
3. The "main-factor" finding must identify the most important technical/conceptual factors that define this topic, with specific named attributes.
4. The "use-case" finding must name 2-3 specific real-world scenarios where this is applied, with concrete outcomes.
5. The "limitation" finding must name a specific technical constraint, explain why it occurs, and note any workaround.
6. The "alternative" finding must compare to a real named alternative and explain when to prefer it.
7. The "impact" finding must describe a measurable or observable downstream effect with a specific mechanism.
8. The "discovery" finding must state a non-obvious insight — something that contradicts assumptions or is frequently misunderstood.
9. Evidence items must state WHAT claim they support, WHY it is relevant, and HOW it was established.
10. List only sources you can confidently identify. Never invent citations, authors, publication details, dates, or URLs; use an empty sources array if no source can be named reliably.
11. Do NOT invent specific statistics (percentages, exact numbers) unless they are widely accepted facts.
12. Do NOT use generic phrases like "has advantages and disadvantages" or "is widely used" without specifics.

REQUIRED JSON SCHEMA (return this exact structure):
{
  "researchType": "<single|comparison>",
  "summary": "<2-3 sentences that directly address the research question or describe the core insight>",
  "sources": [
    { "id": "s1", "label": "<identifiable, reliable reference>" }
  ],
  "evidence": [
    { "id": "e1", "text": "<What claim this supports. Specific evidence statement. Why it matters.>", "category": "main-factor" },
    { "id": "e2", "text": "<What claim this supports. Specific evidence statement. Why it matters.>", "category": "use-case" },
    { "id": "e3", "text": "<What claim this supports. Specific evidence statement. Why it matters.>", "category": "impact" }
  ],
  "findings": [
    { "id": "f1", "title": "<specific title naming the mechanism or factor>", "summary": "<2 sentences: what it is and why it matters specifically for ${input.title}>", "category": "main-factor", "tags": ["<specific tag>", "<specific tag>"] },
    { "id": "f2", "title": "<specific use case title>", "summary": "<2 sentences: where it is used and what concrete outcome it produces>", "category": "use-case", "tags": ["<specific tag>", "<specific tag>"] },
    { "id": "f3", "title": "<specific limitation title>", "summary": "<2 sentences: what the constraint is, why it occurs, and any workaround>", "category": "limitation", "tags": ["<specific tag>", "<specific tag>"] },
    { "id": "f4", "title": "<alternative approach title>", "summary": "<2 sentences: what the alternative is and when to prefer it over the main topic>", "category": "alternative", "tags": ["<specific tag>", "<specific tag>"] },
    { "id": "f5", "title": "<impact title>", "summary": "<2 sentences: what downstream effect occurs and what mechanism drives it>", "category": "impact", "tags": ["<specific tag>", "<specific tag>"] },
    { "id": "f6", "title": "<discovery/insight title>", "summary": "<2 sentences: a non-obvious finding or frequently misunderstood aspect>", "category": "discovery", "tags": ["<specific tag>", "<specific tag>"] }
  ],
  "relationships": [
    { "from": "f1", "to": "f5", "label": "<specific causal or logical relationship>" },
    { "from": "f2", "to": "f3", "label": "<specific relationship>" },
    { "from": "f4", "to": "f2", "label": "<specific relationship>" },
    { "from": "f6", "to": "f1", "label": "<specific relationship>" }
  ],
  "insights": [
    { "metric": "<specific dimension>", "valueA": <0-100>, "valueB": <0-100>, "labelA": "<first subject or topic strengths>", "labelB": "<second subject or topic trade-offs>" },
    { "metric": "<specific dimension>", "valueA": <0-100>, "valueB": <0-100>, "labelA": "<first subject or topic strengths>", "labelB": "<second subject or topic trade-offs>" },
    { "metric": "<specific dimension>", "valueA": <0-100>, "valueB": <0-100>, "labelA": "<first subject or topic strengths>", "labelB": "<second subject or topic trade-offs>" },
    { "metric": "<specific dimension>", "valueA": <0-100>, "valueB": <0-100>, "labelA": "<first subject or topic strengths>", "labelB": "<second subject or topic trade-offs>" }
  ]
}

STRICT OUTPUT RULES:
- Up to 4 credible sources, exactly 3 evidence items, 6 findings, 4 relationships, and 4 insights.
- Finding categories must be exactly: main-factor, use-case, limitation, alternative, impact, discovery (one each, in any order).
- All valueA and valueB must be integers 0-100.
- researchType must be exactly "single" or "comparison".
- Return ONLY the JSON object. No markdown. No explanation text.

JSON:`
}

// ─── JSON extraction + validation ────────────────────────────────────────────

const VALID_CATEGORIES = new Set([
  'main-factor', 'use-case', 'limitation', 'alternative', 'impact', 'discovery',
])

function extractJson(raw: string): string {
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) return fenceMatch[1].trim()
  const start = raw.indexOf('{')
  const end   = raw.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) return raw.slice(start, end + 1)
  return raw.trim()
}

function validateAndCoerce(parsed: unknown, input: WatsonxInput): WatsonxResearchResult {
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Model did not return a JSON object')
  }

  const obj = parsed as Record<string, unknown>

  if (typeof obj.summary !== 'string' || !obj.summary.trim()) {
    throw new Error('Missing or empty "summary"')
  }
  if (!Array.isArray(obj.sources)) {
    throw new Error('Missing "sources" array')
  }
  if (!Array.isArray(obj.evidence) || obj.evidence.length === 0) {
    throw new Error('Missing or empty "evidence" array')
  }
  if (!Array.isArray(obj.findings) || obj.findings.length === 0) {
    throw new Error('Missing or empty "findings" array')
  }

  const findings = (obj.findings as Array<Record<string, unknown>>).map((f, i) => {
    const cat = typeof f.category === 'string' ? f.category.toLowerCase().trim() : ''
    if (!VALID_CATEGORIES.has(cat)) {
      const fallback = ['main-factor', 'use-case', 'limitation', 'alternative', 'impact', 'discovery']
      f.category = fallback[i % fallback.length]
    } else {
      f.category = cat
    }
    return f
  })

  if (!Array.isArray(obj.relationships)) obj.relationships = []

  if (!Array.isArray(obj.insights) || obj.insights.length === 0) {
    throw new Error('Missing or empty "insights" array')
  }
  const insights = (obj.insights as Array<Record<string, unknown>>).map(ins => ({
    ...ins,
    valueA: Math.min(100, Math.max(0, Number(ins.valueA) || 50)),
    valueB: Math.min(100, Math.max(0, Number(ins.valueB) || 50)),
  }))

  const researchType = obj.researchType === 'comparison' || obj.researchType === 'single'
    ? obj.researchType
    : classifyResearchType(input.title, input.question)

  return {
    researchType,
    summary:       obj.summary as string,
    sources:       obj.sources as WatsonxResearchResult['sources'],
    evidence:      obj.evidence as WatsonxResearchResult['evidence'],
    findings:      findings    as WatsonxResearchResult['findings'],
    relationships: obj.relationships as WatsonxResearchResult['relationships'],
    insights:      insights    as WatsonxResearchResult['insights'],
  }
}

// ─── Main exported function ───────────────────────────────────────────────────

export async function callWatsonx(input: WatsonxInput): Promise<WatsonxResearchResult> {
  const watsonxUrl = process.env.WATSONX_URL
  const projectId  = process.env.WATSONX_PROJECT_ID
  const modelId    = process.env.WATSONX_MODEL_ID

  if (!watsonxUrl || !projectId || !modelId) {
    throw new Error('Missing WATSONX_URL, WATSONX_PROJECT_ID, or WATSONX_MODEL_ID in .env')
  }

  const iamToken = await getIamToken()
  const prompt   = buildPrompt(input)

  const endpoint = `${watsonxUrl.replace(/\/$/, '')}/ml/v1/text/generation?version=2023-05-29`

  const body = {
    model_id:   modelId,
    project_id: projectId,
    input:      prompt,
    parameters: {
      decoding_method:    'greedy',
      max_new_tokens:     2400,   // increased to accommodate richer findings
      min_new_tokens:     200,
      repetition_penalty: 1.05,
      stop_sequences:     ['\n\nHuman:', '\n\nUser:'],
    },
  }

  console.log(`[watsonx] Calling ${endpoint} with model ${modelId}`)
  console.log(`[watsonx] Topic: "${input.title}" | Goal: ${input.goal} | Domain: ${input.domain}`)

  const res = await fetch(endpoint, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${iamToken}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errBody = await res.text()
    throw new Error(`watsonx API error (${res.status}): ${errBody.slice(0, 300)}`)
  }

  const data = await res.json() as {
    results?: Array<{ generated_text: string }>
  }

  const rawText = data.results?.[0]?.generated_text ?? ''
  if (!rawText.trim()) throw new Error('watsonx returned empty generated_text')

  console.log(`[watsonx] Raw response (first 300 chars): ${rawText.slice(0, 300)}`)

  const jsonStr = extractJson(rawText)
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonStr)
  } catch (e) {
    throw new Error(`Failed to parse model JSON: ${(e as Error).message}\nRaw: ${jsonStr.slice(0, 400)}`)
  }

  return validateAndCoerce(parsed, input)
}

type WatsonxChatRole = 'system' | 'user' | 'assistant'

export async function callWatsonxChat(messages: Array<{ role: WatsonxChatRole; content: string }>): Promise<string> {
  const watsonxUrl = process.env.WATSONX_URL
  const projectId  = process.env.WATSONX_PROJECT_ID
  const modelId    = process.env.WATSONX_MODEL_ID

  if (!watsonxUrl || !projectId || !modelId) {
    throw new Error('Missing WATSONX_URL, WATSONX_PROJECT_ID, or WATSONX_MODEL_ID in .env')
  }

  const iamToken = await getIamToken()

  const prompt = messages.map(m => {
    if (m.role === 'system') return `[INST] <<SYS>>\n${m.content}\n<</SYS>> [/INST]\n`
    if (m.role === 'user') return `[INST] ${m.content} [/INST]\n`
    return `${m.content}\n`
  }).join('')

  const endpoint = `${watsonxUrl.replace(/\/$/, '')}/ml/v1/text/generation?version=2023-05-29`

  const body = {
    model_id:   modelId,
    project_id: projectId,
    input:      prompt,
    parameters: {
      decoding_method:    'greedy',
      max_new_tokens:     1024,
      min_new_tokens:     1,
      repetition_penalty: 1.05,
      stop_sequences:     ['\n\nHuman:', '\n\nUser:', '[INST]'],
    },
  }

  const res = await fetch(endpoint, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${iamToken}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    throw new Error(`watsonx API error (${res.status})`)
  }

  const data = await res.json() as {
    results?: Array<{ generated_text?: string }>
  }
  const rawText = data.results?.[0]?.generated_text ?? ''
  if (!rawText.trim()) throw new Error('watsonx returned empty chat generated_text')
  return rawText.trim()
}

