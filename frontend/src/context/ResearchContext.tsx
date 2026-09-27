// ResearchNest – Shared Research state
// Provides typed Research model + React context so all pages share the same data.

import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Source {
  id: string
  label: string
  url?: string
}

export interface Evidence {
  id: string
  text: string
  category: string
}

export interface Finding {
  id: string
  title: string
  summary: string
  category: 'main-factor' | 'use-case' | 'limitation' | 'alternative' | 'impact' | 'discovery'
  tags: string[]
}

export interface Relationship {
  from: string
  to: string
  label: string
}

export interface Insight {
  metric: string
  valueA: number
  valueB: number
  labelA: string
  labelB: string
}

export interface Research {
  title: string
  question: string
  goal: string
  domain: string
  context: string
  summary: string
  researchType: 'comparison' | 'single'
  sources: Source[]
  evidence: Evidence[]
  findings: Finding[]
  relationships: Relationship[]
  insights: Insight[]
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_SOURCES: Source[] = [
  { id: 's1', label: 'Resource link 1' },
  { id: 's2', label: 'Resource link 2' },
  { id: 's3', label: 'Resource link 3' },
  { id: 's4', label: 'Resource link 4' },
]

const MOCK_EVIDENCE: Evidence[] = [
  { id: 'e1', text: 'Primary evidence supporting the core contribution.', category: 'main-factor' },
  { id: 'e2', text: 'Evidence demonstrating practical applicability.', category: 'use-case' },
  { id: 'e3', text: 'Supporting evidence for the observed impact.', category: 'impact' },
]

const MOCK_FINDINGS: Finding[] = [
  {
    id: 'f1',
    title: 'Core Contribution Factors',
    summary: 'Three primary factors contribute significantly to the research outcome, each validated across multiple independent sources.',
    category: 'main-factor',
    tags: ['Core', 'Factor', 'Validated'],
  },
  {
    id: 'f2',
    title: 'Practical Application',
    summary: 'Multiple real-world use cases demonstrate the value and adaptability of this approach in diverse production environments.',
    category: 'use-case',
    tags: ['Application', 'Production', 'Real-world'],
  },
  {
    id: 'f3',
    title: 'Core Limitation Identified',
    summary: 'A fundamental constraint limits applicability in high-latency contexts; mitigation strategies are partially effective.',
    category: 'limitation',
    tags: ['Constraint', 'Scope', 'Latency'],
  },
  {
    id: 'f4',
    title: 'Alternative Approach',
    summary: 'An alternative methodology shows comparable or superior performance under specific low-resource conditions.',
    category: 'alternative',
    tags: ['Alternative', 'Performance', 'Method'],
  },
  {
    id: 'f5',
    title: 'Major Consequence / Impact',
    summary: 'The primary impact cascades through multiple downstream systems, improving overall throughput by an estimated 18–24%.',
    category: 'impact',
    tags: ['Impact', 'Downstream', 'Throughput'],
  },
  {
    id: 'f6',
    title: 'Important Discovery',
    summary: 'A key insight emerged that reframes understanding of the problem — correlation is stronger than causation here.',
    category: 'discovery',
    tags: ['Discovery', 'Insight', 'Correlation'],
  },
]

const MOCK_RELATIONSHIPS: Relationship[] = [
  { from: 'f1', to: 'f5', label: 'causes' },
  { from: 'f2', to: 'f3', label: 'bounded by' },
  { from: 'f4', to: 'f2', label: 'alternative to' },
  { from: 'f6', to: 'f1', label: 'supports' },
]

const MOCK_INSIGHTS: Insight[] = [
  { metric: 'Flexibility',  valueA: 35,  valueB: 68,  labelA: 'Comparison data 1', labelB: 'Comparison data 2' },
  { metric: 'Simplicity',  valueA: 62,  valueB: 42,  labelA: 'Comparison data 1', labelB: 'Comparison data 2' },
  { metric: 'Tooling',     valueA: 78,  valueB: 55,  labelA: 'Comparison data 1', labelB: 'Comparison data 2' },
  { metric: 'Efficiency',  valueA: 48,  valueB: 75,  labelA: 'Comparison data 1', labelB: 'Comparison data 2' },
]

// ─── Builder ──────────────────────────────────────────────────────────────────

/** Merges user-provided fields with mock findings/evidence/insights. */
export function buildResearch(partial: Partial<Research>): Research {
  return {
    title:         partial.title    || 'TOPIC NAME',
    question:      partial.question || '',
    goal:          partial.goal     || 'Explore',
    domain:        partial.domain   || 'Technology',
    context:       partial.context  || '',
    summary:       partial.summary  || '',
    researchType:  partial.researchType ?? 'single',
    sources:       partial.sources       ?? MOCK_SOURCES,
    evidence:      partial.evidence      ?? MOCK_EVIDENCE,
    findings:      partial.findings      ?? MOCK_FINDINGS,
    relationships: partial.relationships ?? MOCK_RELATIONSHIPS,
    insights:      partial.insights      ?? MOCK_INSIGHTS,
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface ResearchContextType {
  research: Research
  setResearch: (r: Research) => void
}

const ResearchContext = createContext<ResearchContextType>({
  research:    buildResearch({}),
  setResearch: () => {},
})

export function ResearchProvider({ children }: { children: ReactNode }) {
  const [research, setResearch] = useState<Research>(buildResearch({}))
  return (
    <ResearchContext.Provider value={{ research, setResearch }}>
      {children}
    </ResearchContext.Provider>
  )
}

export function useResearch(): ResearchContextType {
  return useContext(ResearchContext)
}
