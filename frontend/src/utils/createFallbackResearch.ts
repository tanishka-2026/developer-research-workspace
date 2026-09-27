import type { AnalyzePayload, AnalyzeResult } from '../api/analyzeApi'
import type { Source } from '../context/ResearchContext'

export interface FallbackResearch extends AnalyzeResult {
  analysisMode: 'fallback-preview'
  previewComparisonSubjects: string[]
  previewComparisonAreas: string[]
}

export interface UserResearchResource {
  label: string
  selected: boolean
}

function classifyResearchType(title: string, question: string, goal: string): 'single' | 'comparison' {
  const text = `${title} ${question}`.trim()
  const signals = [
    /\b(.+?)\s+(?:vs\.?|versus|compared\s+with|compared\s+to)\s+(.+?)(?:[.!?;,]|$)/i,
    /\bcompare(?:d)?\s+(.+?)\s+(?:with|against|to|and)\s+(.+?)(?:[.!?;,]|$)/i,
    /\bcompar(?:e|ison)\s+(?:between|of)\s+(.+?)\s+(?:and|vs\.?|versus)\s+(.+?)(?:[.!?;,]|$)/i,
    /\bdifferences?\s+between\s+(.+?)\s+and\s+(.+?)(?:[.!?;,]|$)/i,
  ]
  if (signals.some(pattern => pattern.test(text))) return 'comparison'
  return goal.toLowerCase().includes('compare') && /\b\w+\s+and\s+\w+/i.test(text) ? 'comparison' : 'single'
}

function comparisonSubjects(text: string): [string, string] | [] {
  const patterns = [
    /\b(.+?)\s+(?:vs\.?|versus|compared\s+with|compared\s+to)\s+(.+?)(?:\s+for\s+.+)?[.!?;,]*$/i,
    /\bcompare(?:d)?\s+(.+?)\s+(?:with|against|to|and)\s+(.+?)(?:\s+for\s+.+)?[.!?;,]*$/i,
    /\bcompar(?:e|ison)\s+(?:between|of)\s+(.+?)\s+(?:and|vs\.?|versus)\s+(.+?)(?:\s+for\s+.+)?[.!?;,]*$/i,
    /\bdifferences?\s+between\s+(.+?)\s+and\s+(.+?)(?:\s+for\s+.+)?[.!?;,]*$/i,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return [match[1].trim(), match[2].trim()]
  }
  return []
}

function makeSources(resources: UserResearchResource[] = []): Source[] {
  return resources
    .filter(resource => resource.selected && resource.label.trim() && !/^Resource link \d+$/i.test(resource.label.trim()))
    .map((resource, index) => {
      const label = resource.label.trim()
      try {
        const url = new URL(label)
        if (url.protocol === 'http:' || url.protocol === 'https:') {
          return { id: `user-source-${index + 1}`, label, url: url.toString() }
        }
      } catch {
        // User-provided labels are retained as labels, never turned into invented URLs.
      }
      return { id: `user-source-${index + 1}`, label }
    })
}

// This fallback is used only when the external AI service is unavailable. It is not presented as AI-generated research.
export function createFallbackResearch(
  payload: AnalyzePayload,
  resources: UserResearchResource[] = [],
  apiResearchType?: 'single' | 'comparison',
): FallbackResearch {
  const researchType = apiResearchType ?? classifyResearchType(payload.title, payload.question, payload.goal)
  const focus = payload.question.trim() || payload.title.trim() || 'the submitted topic'
  const contextNote = payload.context.trim()
    ? ` Include the submitted context in the investigation: “${payload.context.trim()}”.`
    : ''
  const goalNote = payload.goal.trim()
    ? ` Frame the investigation around the stated goal: “${payload.goal.trim()}”.`
    : ''
  const subjects = researchType === 'comparison'
    ? comparisonSubjects(`${payload.title} ${payload.question}`.trim())
    : []
  const subjectText = subjects.length === 2 ? `${subjects[0]} and ${subjects[1]}` : payload.title.trim()

  const areas = [
    { category: 'main-factor' as const, label: 'Core concepts', prompt: `What concepts and mechanisms are central to ${focus}?` },
    { category: 'use-case' as const, label: 'Use cases', prompt: `Which use cases are relevant to ${focus} in the ${payload.domain} domain?` },
    { category: 'limitation' as const, label: 'Constraints', prompt: `What limitations or constraints should be checked when investigating ${focus}?` },
    { category: 'alternative' as const, label: 'Alternatives', prompt: `Which alternatives or related approaches should be considered for ${focus}?` },
    { category: 'impact' as const, label: 'Implications', prompt: `What impacts or outcomes should research on ${focus} measure or verify?` },
    { category: 'discovery' as const, label: 'Open questions', prompt: `What unresolved questions about ${focus} merit further investigation?` },
  ]

  const previewComparisonAreas = researchType === 'comparison'
    ? [
        `Compare the core approaches used by ${subjectText} in relation to the stated question.`,
        `Investigate use cases and constraints for ${subjectText} in the ${payload.domain} domain.`,
        `Identify what evidence would be needed to compare ${subjectText} fairly.`,
        `Determine which trade-offs matter for the stated goal: ${payload.goal}.`,
      ]
    : []

  return {
    analysisMode: 'fallback-preview',
    researchType,
    previewComparisonSubjects: subjects,
    summary: `AI analysis is unavailable. This structured preview is based only on your submitted input about “${focus}” in ${payload.domain}.${goalNote}${contextNote} No external research or verification was performed.`,
    sources: makeSources(resources),
    evidence: areas.slice(0, 3).map((area, index) => ({
      id: `preview-prompt-${index + 1}`,
      text: `Research prompt: ${area.prompt} This is an area to investigate, not verified evidence.`,
      category: area.category,
    })),
    findings: areas.map((area, index) => ({
      id: `preview-area-${index + 1}`,
      title: `Preliminary research area: ${area.label}`,
      summary: `${area.prompt}${goalNote}${contextNote} This is a prompt for further research, not a verified finding.`,
      category: area.category,
      tags: ['Preview', 'To investigate', payload.domain],
    })),
    relationships: [
      { from: 'preview-area-1', to: 'preview-area-5', label: 'Explore implications of' },
      { from: 'preview-area-2', to: 'preview-area-3', label: 'Check use cases against' },
      { from: 'preview-area-4', to: 'preview-area-2', label: 'Consider alongside' },
      { from: 'preview-area-6', to: 'preview-area-1', label: 'Questions about' },
    ],
    insights: [],
    previewComparisonAreas,
  }
}
