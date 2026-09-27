// ResearchNest – Research Insights / Comparison screen  (route: /insights)
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { useResearch } from '../context/ResearchContext'
import type { Insight, Finding } from '../context/ResearchContext'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  navy:         '#0C0D45',
  blue:         '#3E5BA3',
  teal:         '#75CBD1',
  bg:           '#EAF1FC',
  border:       '#DAE8FB',
  borderMid:    '#C5D6E8',
  white:        '#FFFFFF',
  purpleChip:   '#C0A0D8',
  evidenceChip: '#8090C8',
  gridTeal:     '#75CBD1',
  gridNavy:     '#6878B0',
} as const

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Chip({ label, bg, color, border }: { label: string; bg: string; color: string; border?: string }) {
  return (
    <span style={{
      display: 'inline-block', backgroundColor: bg, color,
      border: border ? `1px solid ${border}` : 'none',
      borderRadius: 999, padding: '3px 11px',
      fontSize: '0.67rem', fontFamily: 'Inter, sans-serif',
      fontWeight: 500, whiteSpace: 'nowrap', lineHeight: 1.7,
    }}>
      {label}
    </span>
  )
}

function BulletRow({ label, color }: { label: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 6 }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: color, flexShrink: 0, marginTop: 4 }} />
      <span style={{ fontSize: '0.74rem', color: C.navy, fontFamily: 'Inter, sans-serif', fontWeight: 500, lineHeight: 1.45 }}>
        {label}
      </span>
    </div>
  )
}

// ─── Donut chart — driven by finding categories ───────────────────────────────
const FINDING_COLORS: Record<string, string> = {
  'main-factor':  '#6BA3D6',
  'use-case':     '#EE82C3',
  'limitation':   '#F4A84A',
  'alternative':  '#B8D96E',
  'impact':       '#D4AAEE',
  'discovery':    '#75CBD1',
}

function DonutChart({ findings }: { findings: Finding[] }) {
  const segments = findings.slice(0, 6).map(f => ({
    label: f.title,
    color: FINDING_COLORS[f.category] ?? '#9090B0',
    value: 1,  // equal weight — what matters is the category distribution
  }))
  if (segments.length === 0) return null
  const total = segments.length
  const r = 68, cx = 90, cy = 90, stroke = 22
  let angle = -90

  const arcs = segments.map((seg) => {
    const sweep = (seg.value / total) * 360
    const start = angle
    angle += sweep
    const toRad = (d: number) => (d * Math.PI) / 180
    const x1 = cx + r * Math.cos(toRad(start))
    const y1 = cy + r * Math.sin(toRad(start))
    const x2 = cx + r * Math.cos(toRad(start + sweep))
    const y2 = cy + r * Math.sin(toRad(start + sweep))
    const large = sweep > 180 ? 1 : 0
    return { ...seg, d: `M${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2}`, sweep }
  })

  return (
    <svg width={180} height={180} viewBox="0 0 180 180">
      {arcs.map((arc, i) => (
        <path key={i} d={arc.d} fill="none" stroke={arc.color} strokeWidth={stroke} strokeLinecap="butt" />
      ))}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="11" fontWeight="700" fill={C.navy} fontFamily="Inter,sans-serif">
        {findings.length} findings
      </text>
      <text x={cx} y={cy + 11} textAnchor="middle" fontSize="7" fill="#9090B0" fontFamily="Inter,sans-serif">
        across {[...new Set(findings.map(f => f.category))].length} categories
      </text>
    </svg>
  )
}

// ─── Grid view ────────────────────────────────────────────────────────────────
const GRID_ROWS = 7
const GRID_COLS = 14
const GRID_GAP  = 5

function GridView({ insights }: { insights: Insight[] }) {
  // Teal column ratio comes from the first insight: valueA / (valueA + valueB)
  const ratio = insights.length > 0
    ? insights[0].valueA / (insights[0].valueA + insights[0].valueB)
    : 5 / 14
  const tealCols = Math.round(ratio * GRID_COLS)

  return (
    <motion.div
      key="grid"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      style={{ padding: '12px 14px 16px' }}
    >
      <div style={{
        textAlign: 'center', padding: '8px 0 14px',
        fontSize: '0.95rem', color: '#6870A8', fontStyle: 'italic',
        fontFamily: 'Inter, sans-serif',
      }}>
        {insights.length > 0
          ? `${insights[0].labelA} (teal) vs ${insights[0].labelB} (navy)`
          : 'Factor based upon which compared'}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: GRID_GAP }}>
        {Array.from({ length: GRID_ROWS }).map((_, row) => (
          <div key={row} style={{ display: 'flex', gap: GRID_GAP }}>
            {Array.from({ length: GRID_COLS }).map((_, col) => {
              const isTeal = col < tealCols
              return (
                <motion.div
                  key={col}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.16, delay: (row * GRID_COLS + col) * 0.003 }}
                  style={{
                    flex: '1 1 0', aspectRatio: '1 / 1', borderRadius: 7,
                    backgroundColor: isTeal ? C.gridTeal : C.gridNavy,
                    opacity: isTeal ? 1 : 0.72, minWidth: 0,
                  }}
                />
              )
            })}
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ─── Bar graph view — driven by research.insights ─────────────────────────────
const BAR_CHART_H = 280

function BarGraphView({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return (
    <div style={{ padding: 32, textAlign: 'center', color: '#9090B0', fontStyle: 'italic', fontSize: '0.85rem' }}>
      No comparison data available.
    </div>
  )

  const maxVal = Math.max(...insights.flatMap(ins => [ins.valueA, ins.valueB]), 1)
  const barW   = 18

  return (
    <motion.div
      key="bargraph"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      style={{ padding: '16px 16px 14px' }}
    >
      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14, justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: C.gridNavy }} />
          <span style={{ fontSize: '0.72rem', color: C.navy, fontStyle: 'italic' }}>{insights[0].labelA}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: C.gridTeal }} />
          <span style={{ fontSize: '0.72rem', color: C.navy, fontStyle: 'italic' }}>{insights[0].labelB}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 0 }}>
        {/* Y-axis */}
        <div style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          height: BAR_CHART_H, width: 28, flexShrink: 0, marginBottom: 40,
        }}>
          {[100, 75, 50, 25, 0].map(t => (
            <span key={t} style={{ fontSize: '0.6rem', color: '#8090B0', textAlign: 'right', lineHeight: 1 }}>{t}</span>
          ))}
        </div>

        {/* Chart area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{
            position: 'relative', height: BAR_CHART_H,
            borderLeft: `1px solid ${C.borderMid}`, borderBottom: `1px solid ${C.borderMid}`,
          }}>
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => (
              <div key={i} style={{
                position: 'absolute', left: 0, right: 0,
                top: `${frac * 100}%`,
                borderTop: i === 0 ? 'none' : `1px solid ${C.border}`,
                pointerEvents: 'none',
              }} />
            ))}
            {/* Bars */}
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'flex-end',
              justifyContent: 'space-evenly',
              padding: '0 6px',
            }}>
              {insights.map((ins, i) => {
                const h1 = (ins.valueA / maxVal) * BAR_CHART_H
                const h2 = (ins.valueB / maxVal) * BAR_CHART_H
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3 }}>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: h1 }}
                        transition={{ duration: 0.55, delay: i * 0.055, ease: 'easeOut' }}
                        style={{ width: barW, borderRadius: '3px 3px 0 0', backgroundColor: C.gridNavy, flexShrink: 0 }}
                      />
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: h2 }}
                        transition={{ duration: 0.55, delay: i * 0.055 + 0.055, ease: 'easeOut' }}
                        style={{ width: barW, borderRadius: '3px 3px 0 0', backgroundColor: C.gridTeal, flexShrink: 0 }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          {/* X-axis labels */}
          <div style={{
            height: 40, display: 'flex', alignItems: 'flex-start',
            justifyContent: 'space-evenly', padding: '5px 6px 0',
          }}>
            {insights.map((ins, i) => (
              <div key={i} style={{
                fontSize: '0.62rem', color: '#8090B0', textAlign: 'center',
                whiteSpace: 'pre-line', lineHeight: 1.3,
                width: 46, flexShrink: 0,
              }}>
                {ins.metric}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Ask ResearchNest panel ───────────────────────────────────────────────────
function AskPanel() {
  const [input, setInput] = useState('')
  const msgs = [
    { role: 'user', text: 'Hello, ResearchNest help me understand the insights' },
    { role: 'ai',   text: 'The Insights page shows how the two subjects in your research compare across key metrics. Use the bar graph to see which performs better on each dimension.' },
    { role: 'user', text: 'Which subject scored higher overall?' },
    { role: 'ai',   text: 'Analyzing...' },
  ]
  return (
    <div style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 3px 16px rgba(62,91,163,0.10)', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px 9px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: C.bg, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <circle cx="5.5" cy="5.5" r="4" stroke={C.blue} strokeWidth="1" />
            <ellipse cx="5.5" cy="5.5" rx="1.8" ry="4" stroke={C.blue} strokeWidth="0.8" />
          </svg>
        </div>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: C.navy }}>Ask ResearchNest</span>
      </div>
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {m.role === 'ai' && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                <div style={{ width: 17, height: 17, borderRadius: '50%', backgroundColor: C.bg, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <circle cx="4" cy="4" r="2.8" stroke={C.blue} strokeWidth="0.85" />
                    <ellipse cx="4" cy="4" rx="1.1" ry="2.8" stroke={C.blue} strokeWidth="0.65" />
                  </svg>
                </div>
                <div style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, borderRadius: '0 9px 9px 9px', padding: '7px 10px', maxWidth: 215, fontSize: '0.68rem', color: C.navy, lineHeight: 1.55 }}>
                  {m.text === 'Analyzing...' ? <span style={{ color: '#9090B0', fontStyle: 'italic' }}>Analyzing...</span> : m.text}
                </div>
              </div>
            )}
            {m.role === 'user' && (
              <div style={{ backgroundColor: C.navy, borderRadius: '9px 0 9px 9px', padding: '7px 10px', maxWidth: 200, fontSize: '0.68rem', color: C.white, lineHeight: 1.5 }}>
                {m.text}
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ padding: '7px 12px 12px', borderTop: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: C.bg, border: `1px solid ${C.border}`, borderRadius: 999, padding: '7px 12px' }}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <circle cx="4.5" cy="4.5" r="3.5" stroke={C.teal} strokeWidth="1.1" />
            <path d="M7.5 7.5l2 2" stroke={C.teal} strokeWidth="1.1" strokeLinecap="round" />
          </svg>
          <input type="text" placeholder="Ask Searchflow" value={input} onChange={e => setInput(e.target.value)}
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '0.73rem', color: C.navy, fontFamily: 'Inter, sans-serif' }} />
          <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
            style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: C.navy, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M5 8V2M2 5l3-3 3 3" stroke="#FFF" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
type ViewMode = 'grid' | 'bar'

function QualitativeComparisonPreview({ areas }: { areas: string[] }) {
  return (
    <div style={{ padding: '20px 22px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: C.navy, marginBottom: 4 }}>Qualitative comparison preview</div>
      <p style={{ fontSize: '0.7rem', color: C.blue, lineHeight: 1.5, margin: '0 0 14px' }}>
        These are investigation prompts based on the comparison you entered, not evaluated results or scores.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {areas.map((area, index) => (
          <div key={index} style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: 10, fontSize: '0.74rem', color: C.navy, lineHeight: 1.55 }}>
            <span style={{ color: C.blue, fontWeight: 700, marginRight: 8 }}>{index + 1}.</span>{area}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function InsightsPage() {
  const { research } = useResearch()
  const navigate     = useNavigate()
  const [view,   setView  ] = useState<ViewMode>('bar')
  const [search, setSearch] = useState('')
  const isFallback = research.analysisMode === 'fallback-preview'

  // Guard: Insights is only for comparison research
  useEffect(() => {
    if (research.researchType === 'single') {
      navigate('/analysis', { replace: true })
    }
  }, [research.researchType, navigate])

  const isComp   = research.researchType === 'comparison'
  const labelA   = isComp ? research.insights[0]?.labelA ?? research.previewComparisonSubjects?.[0] ?? '' : ''
  const labelB   = isComp ? research.insights[0]?.labelB ?? research.previewComparisonSubjects?.[1] ?? '' : ''

  // For Key Difference: use the discovery finding summary
  const discoveryFinding  = research.findings.find(f => f.category === 'discovery')
  const limitationFinding = research.findings.find(f => f.category === 'limitation')
  const alternativeFinding = research.findings.find(f => f.category === 'alternative')

  // Trade-off bullets from limitation + alternative tags
  const tradeoffA = limitationFinding?.tags   ?? ['Constraint', 'Scope', 'Latency']
  const tradeoffB = alternativeFinding?.tags  ?? ['Flexibility', 'Performance', 'Method']

  // Evidence card: first evidence item
  const firstEvidence = research.evidence[0]

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
      style={{ minHeight: '100vh', backgroundColor: C.bg, fontFamily: 'Inter, system-ui, sans-serif', paddingBottom: 56 }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 22px' }}>

        {/* ── Status bar ─────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, paddingBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: C.teal, flexShrink: 0 }} />
            <span style={{ fontSize: '0.78rem', color: C.blue, fontStyle: 'italic' }}>
              {isFallback ? 'Qualitative comparison preview from your input' : 'Analyzing Your entire research Insights on the topic provided…'}
            </span>
          </div>
          <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: C.bg, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="5.5" stroke={C.blue} strokeWidth="1.1" />
              <ellipse cx="7" cy="7" rx="2.2" ry="5.5" stroke={C.blue} strokeWidth="0.9" />
              <circle cx="7" cy="7" r="1.8" fill={C.blue} />
            </svg>
          </div>
        </div>

        {isFallback && (
          <div role="status" style={{ backgroundColor: '#F2D2FF', border: `1px solid ${C.purpleChip}`, borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontFamily: 'Inter, sans-serif' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: C.navy, marginBottom: 3 }}>AI analysis temporarily unavailable</div>
            <div style={{ fontSize: '0.72rem', color: C.navy, lineHeight: 1.5 }}>This comparison preview contains prompts based on your input only. It has no generated scores or verified conclusions.</div>
          </div>
        )}

        {/* ── Topic / headline bar ────────────────────────────── */}
        <div style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', marginBottom: 12, boxShadow: '0 1px 4px rgba(62,91,163,0.06)' }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <span style={{ fontSize: '1.05rem', color: '#6870A8', fontStyle: 'italic', fontFamily: 'Caveat, cursive' }}>
              {research.title || 'Compare findings, explore patterns, and identify key relationships.'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <div style={{ backgroundColor: C.navy, color: C.white, borderRadius: 999, padding: '5px 14px', fontSize: '0.73rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
              Source count
              <span style={{ backgroundColor: C.blue, color: C.white, borderRadius: '50%', width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700 }}>
                {research.sources.length}
              </span>
            </div>
            <div style={{ backgroundColor: C.teal, color: C.white, borderRadius: 999, padding: '5px 14px', fontSize: '0.73rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 7 }}>
              {research.domain}
              <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: C.navy }} />
            </div>
          </div>
        </div>

        {/* ── Controls row ────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: '0.78rem', color: C.navy, fontWeight: 500, whiteSpace: 'nowrap' }}>{isFallback ? 'Preview mode' : 'Insight view:'}</span>
            {!isFallback && (
              <button
                onClick={() => setView(v => v === 'bar' ? 'grid' : 'bar')}
                style={{ backgroundColor: C.navy, color: C.white, border: `1px solid ${C.navy}`, borderRadius: 999, padding: '4px 13px', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}
              >
                {view === 'bar' ? 'Bar Graph' : 'Grid'}
              </button>
            )}
          </div>

          {/* Comparison labels — only shown for comparison topics */}
          {isComp && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: `1px solid ${C.border}`, borderRadius: 999, padding: '4px 10px 4px 8px', backgroundColor: C.white }}>
                <div style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: C.teal, flexShrink: 0 }} />
                <span style={{ fontSize: '0.72rem', color: C.navy, fontStyle: 'italic', whiteSpace: 'nowrap' }}>{labelA}</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: C.blue, fontWeight: 500 }}>vs</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: `1px solid ${C.navy}`, borderRadius: 999, padding: '4px 8px 4px 10px', backgroundColor: C.navy }}>
                <span style={{ fontSize: '0.72rem', color: C.white, fontStyle: 'italic', whiteSpace: 'nowrap' }}>{labelB}</span>
                <div style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: C.blue, flexShrink: 0 }} />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: C.white, border: `1px solid ${C.border}`, borderRadius: 999, padding: '5px 12px', cursor: 'text' }}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <circle cx="4.5" cy="4.5" r="3.5" stroke={C.blue} strokeWidth="1.2" />
                <path d="M7.5 7.5l2 2" stroke={C.blue} strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <input type="text" placeholder="Search the map" value={search} onChange={e => setSearch(e.target.value)}
                style={{ border: 'none', outline: 'none', fontSize: '0.72rem', color: C.navy, background: 'transparent', width: 108, fontFamily: 'Inter, sans-serif' }} />
            </label>
            <button style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: '5px 12px', fontSize: '0.72rem', color: C.blue, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>Chart</button>
          </div>
        </div>

        {/* ── Main two-column area ────────────────────────────── */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 14 }}>

          {/* LEFT: visualisation card */}
          <div style={{ flex: '1 1 0', minWidth: 0, backgroundColor: C.white, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 14px rgba(62,91,163,0.08)' }}>
            <AnimatePresence mode="wait">
              {isFallback
                ? <QualitativeComparisonPreview key="qualitative-preview" areas={research.previewComparisonAreas ?? []} />
                : view === 'grid'
                ? <GridView key="grid" insights={research.insights} />
                : <BarGraphView key="bargraph" insights={research.insights} />
              }
            </AnimatePresence>
          </div>

          {/* RIGHT: research suggests + shared findings */}
          <div style={{ width: 300, flexShrink: 0, backgroundColor: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 16px', boxShadow: '0 2px 14px rgba(62,91,163,0.08)' }}>
            <p style={{ fontSize: '0.78rem', fontStyle: 'italic', color: C.navy, marginBottom: 12, fontWeight: 500 }}>
              {isFallback ? 'Preliminary research areas' : 'What the Research suggests'}
            </p>
            {!isFallback && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                <DonutChart findings={research.findings} />
              </div>
            )}
            <p style={{ fontSize: '0.73rem', fontWeight: 600, color: C.navy, marginBottom: 9 }}>{isFallback ? 'Preliminary areas' : 'Shared findings'}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
              {research.findings.slice(0, 4).map((f) => (
                <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: FINDING_COLORS[f.category] ?? '#9090B0', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.68rem', color: C.navy, lineHeight: 1.4 }}>{f.title}</span>
                </div>
              ))}
            </div>

            {/* Evidence card */}
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ backgroundColor: C.navy, color: C.white, fontSize: '0.63rem', fontWeight: 600, textAlign: 'center', padding: '5px 10px', letterSpacing: '0.02em' }}>
                {isFallback ? 'Research prompts — not verified evidence' : 'Evidence Followed by Impact'}
              </div>
              <div style={{ padding: '8px 11px 10px' }}>
                {firstEvidence
                  ? (
                    <>
                      {isFallback && <div style={{ fontSize: '0.62rem', fontWeight: 700, color: C.blue, marginBottom: 5 }}>Research prompt — not verified evidence</div>}
                      <p style={{ fontSize: '0.7rem', color: C.navy, lineHeight: 1.55, marginBottom: 8 }}>
                        {firstEvidence.text.length > 120
                          ? firstEvidence.text.slice(0, 120) + '…'
                          : firstEvidence.text}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Chip label={`${research.sources.length} Sources`} bg="rgba(128,144,200,0.16)" color="#6070A0" />
                      </div>
                    </>
                  )
                  : (
                    <>
                      <p style={{ fontSize: '0.68rem', fontStyle: 'italic', color: '#8090B0', marginBottom: 8 }}>{isFallback ? 'No prompts available' : 'No evidence yet'}</p>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Chip label="Sources" bg="rgba(128,144,200,0.16)" color="#6070A0" />
                      </div>
                    </>
                  )
                }
              </div>
            </div>
          </div>
        </div>

        {/* ── View toggle pills ──────────────────────────────── */}
        {!isFallback && <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
          {(['grid', 'bar'] as ViewMode[]).map((v) => (
            <button key={v} onClick={() => setView(v)} style={{
              backgroundColor: view === v ? C.white : 'transparent',
              border: `1px solid ${view === v ? C.border : 'transparent'}`,
              borderRadius: 999, padding: '4px 16px',
              fontSize: '0.73rem', color: view === v ? C.navy : C.blue,
              cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: view === v ? 600 : 400,
              transition: 'all 0.15s',
            }}>
              {v === 'grid' ? 'Grid' : 'Bar graph'}
            </button>
          ))}
        </div>}

        {/* ── Bottom row: Key Difference + Trade-off + Ask ─── */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

          {/* Key Difference card */}
          <div style={{ flex: '1 1 0', minWidth: 0, backgroundColor: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 16px', boxShadow: '0 2px 10px rgba(62,91,163,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: C.navy }} />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: C.navy }}>{isFallback ? 'Comparison preview' : 'Key Difference'}</span>
            </div>
            {isComp && (
              <div style={{ display: 'flex', gap: 7, marginBottom: 12 }}>
                <Chip label={labelA} bg={C.white} color={C.navy} border={C.border} />
                <Chip label={labelB} bg={C.white} color={C.navy} border={C.border} />
              </div>
            )}
            <div style={{ backgroundColor: '#F4F5FB', border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 12px', minHeight: 70, marginBottom: 10 }}>
              <p style={{ fontSize: '0.78rem', color: C.navy, lineHeight: 1.6, margin: 0 }}>
                {discoveryFinding?.summary ?? 'No discovery finding available yet.'}
              </p>
            </div>
            <p style={{ fontSize: '0.65rem', color: '#9090B0', fontStyle: 'italic', marginBottom: 12 }}>
              {research.domain} — {research.goal}
            </p>
            <div style={{ display: 'flex', gap: 6 }}>
              {discoveryFinding?.tags.slice(0, 2).map((t, i) => (
                <Chip key={i} label={t} bg="transparent" color={C.purpleChip} border={C.purpleChip} />
              )) ?? <Chip label="Discovery" bg="transparent" color={C.purpleChip} border={C.purpleChip} />}
              <Chip label={isFallback ? 'Preview prompt' : 'Evidence'} bg={C.teal} color={C.white} />
            </div>
          </div>

          {/* Trade-off card */}
          <div style={{ flex: '2 1 0', minWidth: 0, backgroundColor: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 16px', boxShadow: '0 2px 10px rgba(62,91,163,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: C.navy }} />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: C.navy }}>{isFallback ? 'Areas to compare' : 'Trade-off'}</span>
            </div>
            <div style={{ display: 'flex', gap: 14 }}>
              {/* Column A */}
              <div style={{ flex: 1, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ backgroundColor: C.navy, color: C.white, fontSize: '0.65rem', fontWeight: 600, textAlign: 'center', padding: '5px 10px' }}>
                  {isComp ? labelA : (limitationFinding?.title ?? 'Limitation')}
                </div>
                <div style={{ padding: '10px 12px 10px' }}>
                  {tradeoffA.slice(0, 3).map((f) => (
                    <BulletRow key={f} label={f} color={C.blue} />
                  ))}
                </div>
                <div style={{ padding: '0 12px 10px', display: 'flex', justifyContent: 'flex-end' }}>
                  <Chip label={limitationFinding?.tags[0] ?? 'Constraint'} bg="transparent" color={C.purpleChip} border={C.purpleChip} />
                </div>
              </div>
              {/* Column B */}
              <div style={{ flex: 1, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ backgroundColor: C.navy, color: C.white, fontSize: '0.65rem', fontWeight: 600, textAlign: 'center', padding: '5px 10px' }}>
                  {isComp ? labelB : (alternativeFinding?.title ?? 'Alternative')}
                </div>
                <div style={{ padding: '10px 12px 10px' }}>
                  {tradeoffB.slice(0, 3).map((f) => (
                    <BulletRow key={f} label={f} color={C.teal} />
                  ))}
                </div>
                <div style={{ padding: '0 12px 10px', display: 'flex', justifyContent: 'flex-end' }}>
                  <Chip label={alternativeFinding?.tags[0] ?? 'Alternative'} bg="transparent" color={C.purpleChip} border={C.purpleChip} />
                </div>
              </div>
            </div>
            <p style={{ fontSize: '0.68rem', color: '#9090B0', fontStyle: 'italic', margin: '10px 0 10px', lineHeight: 1.5 }}>
              {alternativeFinding?.summary
                ? alternativeFinding.summary.slice(0, 160) + (alternativeFinding.summary.length > 160 ? '…' : '')
                : 'Alternative approach details available after analysis.'}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Chip label={isFallback ? 'Preview prompts' : 'Evidence'} bg={C.teal} color={C.white} />
            </div>
          </div>

          {/* Ask ResearchNest */}
          <div style={{ width: 300, flexShrink: 0 }}>
            <AskPanel />
          </div>

        </div>
      </div>
    </motion.div>
  )
}
