import 'dotenv/config'
import { GoogleGenAI } from '@google/genai'
import { classifyResearchType } from './researchType'

const MODEL = 'gemini-3.8-flash'

export interface GeminiInput {
  title: string
  question: string
  goal: string
  domain: string
  context: string
}

export interface GeminiResearchResult {
  researchType: 'comparison' | 'single'
  analysisMode: 'gemini' | 'fallback-preview'
  summary: string
  sources: Array<{ id: string; label: string; url?: string }>
  evidence: Array<{ id: string; text: string; category: string }>
  findings: Array<{
    id: string
    title: string
    summary: string
    category: 'main-factor' | 'use-case' | 'limitation' | 'alternative' | 'impact' | 'discovery'
    tags: string[]
  }>
  relationships: Array<{ from: string; to: string; label: string }>
  insights: Array<{ metric: string; valueA: number; valueB: number; labelA: string; labelB: string }>
}

export interface GeminiChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

const findingCategories = ['main-factor', 'use-case', 'limitation', 'alternative', 'impact', 'discovery'] as const
const evidenceCategories = [...findingCategories]

const textSchema = { type: 'string', minLength: 1, maxLength: 600 }
const objectSchema = (properties: Record<string, unknown>, required: string[]) => ({
  type: 'object',
  properties,
  required,
  additionalProperties: false,
})
const arraySchema = (items: unknown, minItems: number, maxItems: number) => ({
  type: 'array',
  items,
  minItems,
  maxItems,
})

const researchResponseSchema = {
  ...objectSchema({
    researchType: { type: 'string', enum: ['single', 'comparison'] },
    summary: textSchema,
    sources: arraySchema(objectSchema({ id: textSchema, label: textSchema, url: { type: 'string' } }, ['id', 'label']), 0, 0),
    evidence: arraySchema(objectSchema({
      id: textSchema,
      text: textSchema,
      category: { type: 'string', enum: evidenceCategories },
    }, ['id', 'text', 'category']), 3, 3),
    findings: arraySchema(objectSchema({
      id: textSchema,
      title: textSchema,
      summary: textSchema,
      category: { type: 'string', enum: findingCategories },
      tags: arraySchema(textSchema, 1, 5),
    }, ['id', 'title', 'summary', 'category', 'tags']), 6, 6),
    relationships: arraySchema(objectSchema({
      from: textSchema,
      to: textSchema,
      label: textSchema,
    }, ['from', 'to', 'label']), 0, 8),
    insights: arraySchema(objectSchema({
      metric: textSchema,
      valueA: { type: 'integer', minimum: 0, maximum: 100 },
      valueB: { type: 'integer', minimum: 0, maximum: 100 },
      labelA: textSchema,
      labelB: textSchema,
    }, ['metric', 'valueA', 'valueB', 'labelA', 'labelB']), 0, 4),
  }, ['researchType', 'summary', 'sources', 'evidence', 'findings', 'relationships', 'insights']),
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

let client: GoogleGenAI | undefined

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured in backend/.env')
  client ??= new GoogleGenAI({ apiKey })
  return client
}

export function parseResearchResponse(text: string, input: GeminiInput, groundedSources: GeminiResearchResult['sources'] = []): GeminiResearchResult {
  const fencedJson = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  const candidate = (fencedJson?.[1] ?? text).trim()
  const jsonStart = candidate.indexOf('{')
  let jsonEnd = -1
  let depth = 0
  let inString = false
  let escaped = false
  for (let index = jsonStart; jsonStart >= 0 && index < candidate.length; index += 1) {
    const character = candidate[index]
    if (inString) {
      if (escaped) escaped = false
      else if (character === '\\') escaped = true
      else if (character === '"') inString = false
      continue
    }
    if (character === '"') inString = true
    else if (character === '{') depth += 1
    else if (character === '}' && --depth === 0) {
      jsonEnd = index
      break
    }
  }
  const jsonText = jsonStart >= 0 && jsonEnd >= jsonStart
    ? candidate.slice(jsonStart, jsonEnd + 1)
    : candidate
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    throw new Error('Gemini returned invalid JSON for the research response')
  }

  if (!isRecord(parsed)) {
    throw new Error('Gemini research response must be a JSON object')
  }

  const result = parsed
  const requiredArrays = ['sources', 'evidence', 'findings', 'relationships', 'insights']
  if (typeof result.summary !== 'string' || !result.summary.trim()) {
    throw new Error('Gemini research response is missing summary')
  }
  if (result.researchType !== 'single' && result.researchType !== 'comparison') {
    throw new Error('Gemini research response has an invalid researchType')
  }
  for (const key of requiredArrays) {
    if (!Array.isArray(result[key])) throw new Error(`Gemini research response has an invalid ${key} array`)
  }
  const sources = result.sources as unknown[]
  const evidence = result.evidence as unknown[]
  const findings = result.findings as unknown[]
  const relationships = result.relationships as unknown[]
  const insights = result.insights as unknown[]
  if (sources.length > 4 || evidence.length !== 3 || findings.length !== 6 || relationships.length > 8 || insights.length > 4) {
    throw new Error('Gemini research response does not match the required item counts')
  }

  for (const item of evidence) {
    if (!isRecord(item) || !hasText(item.id) || !hasText(item.text) || typeof item.category !== 'string' || !evidenceCategories.includes(item.category as typeof evidenceCategories[number])) {
      throw new Error('Gemini research response contains invalid evidence')
    }
  }
  for (const item of findings) {
    if (!isRecord(item) || !hasText(item.id) || !hasText(item.title) || !hasText(item.summary) || typeof item.category !== 'string' || !findingCategories.includes(item.category as typeof findingCategories[number]) || !Array.isArray(item.tags) || item.tags.length === 0 || !item.tags.every(hasText)) {
      throw new Error('Gemini research response contains an invalid finding')
    }
  }
  for (const item of relationships) {
    if (!isRecord(item) || !hasText(item.from) || !hasText(item.to) || !hasText(item.label)) {
      throw new Error('Gemini research response contains an invalid relationship')
    }
  }
  for (const item of insights) {
    if (!isRecord(item) || !hasText(item.metric) || !hasText(item.labelA) || !hasText(item.labelB) || !Number.isInteger(item.valueA) || !Number.isInteger(item.valueB) || Number(item.valueA) < 0 || Number(item.valueA) > 100 || Number(item.valueB) < 0 || Number(item.valueB) > 100) {
      throw new Error('Gemini research response contains an invalid insight')
    }
  }

  const expectedCategories = new Set(findingCategories)
  if (findings.some(item => !isRecord(item) || typeof item.category !== 'string' || !expectedCategories.delete(item.category as typeof findingCategories[number])) || expectedCategories.size > 0) {
    throw new Error('Gemini research response must include each finding category exactly once')
  }

  const researchType = classifyResearchType(input.title, input.question)
  if (researchType === 'comparison' && insights.length !== 4) {
    throw new Error('Gemini comparison response must include four structured insights')
  }
  if (researchType === 'single' && insights.length !== 0) {
    throw new Error('Gemini single-topic response must not include comparison insights')
  }
  const findingIds = new Set(findings.flatMap(item => isRecord(item) && hasText(item.id) ? [item.id] : []))
  if (relationships.some(item => !isRecord(item) || !findingIds.has(String(item.from)) || !findingIds.has(String(item.to)))) {
    throw new Error('Gemini research response contains a relationship to an unknown finding')
  }

  return { ...result, researchType, sources: groundedSources } as GeminiResearchResult
}

function buildAnalysisPrompt(input: GeminiInput, researchType: 'single' | 'comparison'): string {
  return `Analyze the user's research request as one topic or question. Do not split a multiword title into separate subjects. The research type has already been determined from explicit comparison intent: "${researchType}". Use exactly that value for researchType.

Return STRICT valid JSON matching the supplied schema. Do not return Markdown, code fences, or prose outside the JSON object. Keep the summary concise. Return six concise findings with topic-specific titles and explanations, one for each required category. Evidence must be discrete, structured support, not a repeated summary. Include only meaningful relationships between finding ids; return an empty array when none can be supported. For single-topic research, return an empty insights array. For comparison research, return four structured insights with labels for each compared subject and meaningful differentiating metrics. Do not invent statistics, citations, authors, or URLs. The sources field in the JSON must be an empty array; the service adds only URLs returned by Gemini's Google Search grounding.

Research request:
${JSON.stringify(input)}`
}
function buildFallbackResearch(
  input: GeminiInput,
  researchType: 'single' | 'comparison',
): GeminiResearchResult {
  const topic = input.title || 'this technology topic'

  const comparisonMatch = input.title.match(
    /^(.+?)\s+(?:vs\.?|versus|against)\s+(.+)$/i,
  )

  const subjectA = comparisonMatch?.[1]?.trim() || 'Option A'
  const subjectB = comparisonMatch?.[2]?.trim() || 'Option B'

  const findings = [
    {
      id: 'f1',
      title: `Core factors in ${topic}`,
      summary: `The main factors to investigate for ${topic} are defined by the research question, goal, domain, and project requirements provided by the developer.`,
      category: 'main-factor' as const,
      tags: ['Core', 'Factors', input.domain || 'Technology'],
    },
    {
      id: 'f2',
      title: `Use cases for ${topic}`,
      summary: `The most relevant use cases should be evaluated against the developer's stated requirements and intended project context.`,
      category: 'use-case' as const,
      tags: ['Use Cases', 'Projects', 'Requirements'],
    },
    {
      id: 'f3',
      title: `Limitations to investigate`,
      summary: `Potential limitations should be checked against the specific constraints and requirements described in the research request.`,
      category: 'limitation' as const,
      tags: ['Limitations', 'Constraints', 'Evaluation'],
    },
    {
      id: 'f4',
      title: `Alternative approaches`,
      summary: `Alternative technologies or approaches can be considered where they better match the project's requirements or constraints.`,
      category: 'alternative' as const,
      tags: ['Alternatives', 'Options', 'Trade-offs'],
    },
    {
      id: 'f5',
      title: `Expected project impact`,
      summary: `The practical impact of the technology should be evaluated in terms of the goals and project requirements supplied by the developer.`,
      category: 'impact' as const,
      tags: ['Impact', 'Project', 'Outcome'],
    },
    {
      id: 'f6',
      title: `Research questions to explore`,
      summary: `Further investigation should focus on the areas identified in the question and context rather than assuming unsupported technical claims.`,
      category: 'discovery' as const,
      tags: ['Discovery', 'Research', 'Questions'],
    },
  ]

  const evidence = [
    {
      id: 'e1',
      text: `Research request: ${input.question || 'No specific question provided.'}`,
      category: 'main-factor',
    },
    {
      id: 'e2',
      text: `Goal: ${input.goal || 'Explore the topic.'}`,
      category: 'use-case',
    },
    {
      id: 'e3',
      text: `Context: ${input.context || 'No additional context provided.'}`,
      category: 'impact',
    },
  ]

  const relationships = [
    { from: 'f1', to: 'f2', label: 'informs' },
    { from: 'f1', to: 'f3', label: 'reveals constraints' },
    { from: 'f3', to: 'f4', label: 'may require' },
    { from: 'f2', to: 'f5', label: 'influences' },
    { from: 'f6', to: 'f1', label: 'supports investigation' },
  ]

  const insights =
    researchType === 'comparison'
      ? [
          {
            metric: 'Performance',
            valueA: 50,
            valueB: 50,
            labelA: subjectA,
            labelB: subjectB,
          },
          {
            metric: 'Ecosystem',
            valueA: 50,
            valueB: 50,
            labelA: subjectA,
            labelB: subjectB,
          },
          {
            metric: 'Learning curve',
            valueA: 50,
            valueB: 50,
            labelA: subjectA,
            labelB: subjectB,
          },
          {
            metric: 'Scalability',
            valueA: 50,
            valueB: 50,
            labelA: subjectA,
            labelB: subjectB,
          },
        ]
      : []

  return {
    researchType,
    analysisMode: 'fallback-preview',
    summary:
      `Research preview for "${topic}". Gemini analysis is temporarily unavailable, ` +
      `so this workspace contains a structured research outline based only on the information provided.`,
    sources: [],
    evidence,
    findings,
    relationships,
    insights,
  }
}
export async function generateResearch(
  input: GeminiInput,
): Promise<GeminiResearchResult> {
  const researchType = classifyResearchType(input.title, input.question)

  try {
    const response = await getClient().models.generateContent({
      model: MODEL,
      contents: buildAnalysisPrompt(input, researchType),
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: researchResponseSchema,
        tools: [{ googleSearch: {} }],
        maxOutputTokens: 6000,
      },
    })

    const text = response.text?.trim()

    if (!text) {
      throw new Error('Gemini returned an empty research response')
    }

    const groundedSources = [
      ...new Map(
        (response.candidates ?? [])
          .flatMap(
            candidate =>
              candidate.groundingMetadata?.groundingChunks ?? [],
          )
          .flatMap(chunk =>
            chunk.web?.uri && chunk.web.title
              ? [{ label: chunk.web.title, url: chunk.web.uri }]
              : [],
          )
          .filter(source => /^https?:\/\//i.test(source.url))
          .map(source => [source.url, source] as const),
      ).values(),
    ]
      .slice(0, 4)
      .map((source, index) => ({
        id: `s${index + 1}`,
        ...source,
      }))

    return {
      ...parseResearchResponse(text, input, groundedSources),
      analysisMode: 'gemini',
    }
  } catch (error) {
  console.error(
    '[Gemini] Analysis unavailable. Returning structured fallback:',
    error,
  )

  return buildFallbackResearch(input, researchType)
}
}

export async function generateChatReply(messages: GeminiChatMessage[]): Promise<string> {
  const systemInstruction = messages.find(message => message.role === 'system')?.content
  const contents = messages
    .filter(message => message.role !== 'system')
    .map(message => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content }],
    }))

  if (contents.length === 0) throw new Error('Gemini chat requires at least one user message')

  const response = await getClient().models.generateContent({
    model: MODEL,
    contents,
    config: {
      systemInstruction,
      temperature: 0.4,
      maxOutputTokens: 1200,
    },
  })

  const text = response.text?.trim()
  if (!text) throw new Error('Gemini returned an empty chat response')
  return text
}
