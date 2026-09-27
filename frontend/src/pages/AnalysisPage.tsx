// ResearchNest – Analysis / Research Map page  (route: /analysis)
import { useState, useRef, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useResearch } from '../context/ResearchContext'
import type { Finding, Evidence, Source, Insight, Research } from '../context/ResearchContext'
import { sendChatMessage } from '../api/chatApi'
import type { ChatMessage } from '../api/chatApi'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  navy:           '#0C0D45',
  blue:           '#3E5BA3',
  teal:           '#75CBD1',
  bg:             '#EAF1FC',
  border:         '#DAE8FB',
  borderMid:      '#C5D6E8',
  white:          '#FFFFFF',
  tealCardBg:     '#DEF2F4',
  tealCardBorder: '#AADDE2',
  tealMed:        '#A4D5DB',
  pinkBg:         '#FBF0FF',
  pinkBorder:     '#F0CCEA',
  purpleChip:     '#C0A0D8',
  purpleChipBg:   '#F2D2FF',
  darkCard:       '#3E4270',
  darkCardBorder: '#5558A0',
  evidenceBg:     '#EAECF5',
  evidenceBorder: '#C8CAD8',
  evidenceChip:   '#8090C8',
} as const

// ─── Chip ─────────────────────────────────────────────────────────────────────
function Chip({ label, bg, color, border }: {
  label: string; bg: string; color: string; border?: string
}) {
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

// ─── Centred pill header badge above card ─────────────────────────────────────
function NodeHeader({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: -13 }}>
      <span style={{
        display: 'inline-block', backgroundColor: bg, color,
        borderRadius: 999, padding: '3px 14px',
        fontSize: '0.6rem', fontWeight: 700,
        lineHeight: 1.7, whiteSpace: 'nowrap',
        boxShadow: '0 1px 6px rgba(0,0,0,0.14)',
        letterSpacing: '0.02em',
      }}>
        {label}
      </span>
    </div>
  )
}

// ─── Truncate text to N words (not chars) ─────────────────────────────────────
function truncWords(text: string, n: number): string {
  const words = text.split(' ')
  if (words.length <= n) return text
  return words.slice(0, n).join(' ') + '…'
}

// ─── Detail panel (modal overlay) ────────────────────────────────────────────
interface DetailPanelProps {
  finding: Finding | null
  evidence: Evidence[]
  sources: Source[]
  onClose: () => void
}

function DetailPanel({ finding, evidence, sources, onClose }: DetailPanelProps) {
  if (!finding) return null

  const catColors: Record<Finding['category'], string> = {
    'main-factor':  '#7880CC',
    'use-case':     '#EAA8D8',
    'limitation':   C.teal,
    'alternative':  '#E8A8D8',
    'impact':       '#D4AAEE',
    'discovery':    C.darkCard,
  }
  const accentColor = catColors[finding.category] ?? C.blue

  const relatedEvidence = evidence.filter(e => e.category === finding.category)

  return (
    <AnimatePresence>
      {finding && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 100,
              backgroundColor: 'rgba(12,13,69,0.45)',
              backdropFilter: 'blur(2px)',
            }}
          />
          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.24 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 101,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                pointerEvents: 'all',
                backgroundColor: C.white,
                borderRadius: 18,
                boxShadow: '0 16px 56px rgba(12,13,69,0.28)',
                width: '100%', maxWidth: 620,
                maxHeight: '85vh',
                overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
                fontFamily: 'Inter, sans-serif',
                margin: '0 16px',
              }}
            >
              {/* Header band */}
              <div style={{
                backgroundColor: accentColor.startsWith('#3E4') ? C.darkCard : C.navy,
                padding: '16px 22px 14px',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
              }}>
                <div>
                  <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 5, fontWeight: 600 }}>
                    {finding.category.replace(/-/g, ' ')}
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: C.white, lineHeight: 1.2 }}>
                    {finding.title}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  style={{
                    background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8,
                    width: 30, height: 30, cursor: 'pointer', color: C.white,
                    fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >×</button>
              </div>

              {/* Body */}
              <div style={{ overflowY: 'auto', padding: '20px 22px 24px', flex: 1 }}>
                {/* Full summary */}
                <p style={{ fontSize: '0.88rem', color: C.navy, lineHeight: 1.65, marginBottom: 20 }}>
                  {finding.summary}
                </p>

                {/* Tags */}
                {finding.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
                    {finding.tags.map((t, i) => (
                      <Chip key={i} label={t} bg={C.bg} color={C.blue} border={C.border} />
                    ))}
                  </div>
                )}

                {/* Evidence */}
                {relatedEvidence.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: C.navy, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                      Supporting Evidence
                    </div>
                    {relatedEvidence.map((ev, i) => (
                      <div key={i} style={{
                        backgroundColor: C.evidenceBg, border: `1px solid ${C.evidenceBorder}`,
                        borderRadius: 10, padding: '11px 14px', marginBottom: 8,
                      }}>
                        <p style={{ fontSize: '0.82rem', color: C.navy, lineHeight: 1.6, margin: 0 }}>
                          {ev.text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Sources */}
                {sources.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: C.navy, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                      Sources
                    </div>
                    {sources.map((s, i) => (
                      <div key={s.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                        <div style={{
                          width: 20, height: 20, borderRadius: '50%',
                          backgroundColor: C.bg, border: `1px solid ${C.border}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
                        }}>
                          <span style={{ fontSize: '0.55rem', color: C.blue, fontWeight: 700 }}>{i + 1}</span>
                        </div>
                        {s.url
                          ? <a href={s.url} target="_blank" rel="noopener noreferrer"
                              style={{ fontSize: '0.8rem', color: C.blue, textDecoration: 'underline', lineHeight: 1.5 }}>
                              {s.label}
                            </a>
                          : <span style={{ fontSize: '0.8rem', color: '#6060A0', fontStyle: 'italic', lineHeight: 1.5 }}>{s.label}</span>
                        }
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Evidence detail panel ────────────────────────────────────────────────────
interface EvidenceDetailProps {
  ev: Evidence | null
  sources: Source[]
  onClose: () => void
}

function EvidenceDetailPanel({ ev, sources, onClose }: EvidenceDetailProps) {
  if (!ev) return null
  return (
    <AnimatePresence>
      {ev && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(12,13,69,0.45)', backdropFilter: 'blur(2px)' }}
          />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.22 }}
            style={{ position: 'fixed', inset: 0, zIndex: 101, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}
          >
            <div onClick={e => e.stopPropagation()} style={{
              pointerEvents: 'all',
              backgroundColor: C.white, borderRadius: 18,
              boxShadow: '0 16px 56px rgba(12,13,69,0.28)',
              width: '100%', maxWidth: 560, maxHeight: '80vh', overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
              fontFamily: 'Inter, sans-serif', margin: '0 16px',
            }}>
              {/* Header */}
              <div style={{ backgroundColor: C.evidenceChip, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>
                  Evidence · {ev.category.replace(/-/g, ' ')}
                </div>
                <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', color: C.white, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>
              <div style={{ overflowY: 'auto', padding: '20px 22px 24px', flex: 1 }}>
                {/* Evidence text */}
                <div style={{ backgroundColor: C.evidenceBg, border: `1px solid ${C.evidenceBorder}`, borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
                  <p style={{ fontSize: '0.9rem', color: C.navy, lineHeight: 1.7, margin: 0 }}>{ev.text}</p>
                </div>
                {/* Sources */}
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: C.navy, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Sources</div>
                {sources.map((s, i) => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: C.bg, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                      <span style={{ fontSize: '0.55rem', color: C.blue, fontWeight: 700 }}>{i + 1}</span>
                    </div>
                    {s.url
                      ? <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.82rem', color: C.blue, textDecoration: 'underline', lineHeight: 1.5 }}>{s.label}</a>
                      : <span style={{ fontSize: '0.82rem', color: '#6060A0', fontStyle: 'italic', lineHeight: 1.5 }}>{s.label}</span>
                    }
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

import { ReactFlow, Background, Controls, useNodesState, useEdgesState, Handle, Position, BackgroundVariant } from '@xyflow/react'
import type { Node, Edge } from '@xyflow/react'
import '@xyflow/react/dist/style.css'

// ─── Node: Central Topic (React Flow) ─────────────────────────────────────────
function TopicNodeRF({ data }: { data: any }) {
  return (
    <div style={{
      width: 220,
      backgroundColor: C.navy, border: `2px solid ${C.blue}`,
      borderRadius: 20, padding: '20px 22px 22px', textAlign: 'center',
      userSelect: 'none', boxShadow: '0 6px 28px rgba(12,13,69,0.30)',
    }}>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Left} style={{ opacity: 0 }} />
      <div style={{ fontSize: '0.55rem', color: 'rgba(218,232,251,0.55)', letterSpacing: '0.12em', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>
        Research Topic
      </div>
      {data.domain && (
        <div style={{ fontSize: '0.5rem', color: 'rgba(117,203,209,0.75)', letterSpacing: '0.08em', marginBottom: 6, textTransform: 'uppercase', fontWeight: 500 }}>
          {data.domain}
        </div>
      )}
      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#FFF', letterSpacing: '0.03em', lineHeight: 1.22, textTransform: 'uppercase' }}>
        {data.title || 'TOPIC NAME'}
      </div>
    </div>
  )
}

// ─── Node: Finding (React Flow) ───────────────────────────────────────────────
function FindingNodeRF({ data }: { data: any }) {
  const finding = data.finding as Finding
  const catColors: Record<string, string> = {
    'main-factor':  '#7880CC',
    'use-case':     '#EAA8D8',
    'limitation':   C.teal,
    'alternative':  '#E8A8D8',
    'impact':       '#D4AAEE',
    'discovery':    C.darkCard,
  }
  const bgColors: Record<string, string> = {
    'main-factor':  C.white,
    'use-case':     C.white,
    'limitation':   C.tealCardBg,
    'alternative':  C.white,
    'impact':       C.white,
    'discovery':    C.darkCard,
  }
  const borderColors: Record<string, string> = {
    'main-factor':  C.border,
    'use-case':     C.border,
    'limitation':   C.tealCardBorder,
    'alternative':  C.border,
    'impact':       C.border,
    'discovery':    C.darkCardBorder,
  }
  
  const accent = catColors[finding.category] || C.navy
  const bg = bgColors[finding.category] || C.white
  const border = borderColors[finding.category] || C.border
  const isDark = finding.category === 'discovery'
  const textColor = isDark ? '#FFF' : C.navy

  return (
    <div 
      onClick={data.onExpand}
      style={{
        width: 240,
        backgroundColor: bg, border: `1px solid ${border}`,
        borderRadius: 12, fontFamily: 'Inter, sans-serif',
        boxShadow: '0 3px 14px rgba(62,91,163,0.09)',
        cursor: 'pointer',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />

      {!isDark ? <NodeHeader label={finding.category.replace(/-/g, ' ')} bg={accent} color={finding.category === 'limitation' ? C.white : (finding.category === 'main-factor' ? C.white : C.navy)} /> : null}
      
      {isDark && (
        <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', padding: '13px 14px 0', letterSpacing: '0.1em' }}>
          {finding.category}
        </div>
      )}

      <div style={{ padding: isDark ? '8px 14px 14px' : '10px 14px 14px' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: textColor, marginBottom: 10, lineHeight: 1.3 }}>
          {finding.title}
        </div>
        <div style={{ fontSize: '0.68rem', color: isDark ? 'rgba(255,255,255,0.8)' : '#8080A8', marginTop: 8, marginBottom: 11, lineHeight: 1.5 }}>
          {truncWords(finding.summary, 20)}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
          {finding.tags.slice(0, 2).map((t: string, i: number) => (
            <Chip key={i} label={t} bg={isDark ? "rgba(255,255,255,0.13)" : "transparent"} color={isDark ? "rgba(255,255,255,0.8)" : C.purpleChip} border={isDark ? undefined : C.purpleChip} />
          ))}
          <span style={{ fontSize: '0.6rem', color: isDark ? 'rgba(255,255,255,0.4)' : C.blue, marginLeft: 'auto', opacity: 0.7 }}>expand</span>
        </div>
      </div>
    </div>
  )
}

// ─── Node: Evidence (React Flow) ──────────────────────────────────────────────
function EvidenceNodeRF({ data }: { data: any }) {
  const items = (data.evidence as Evidence[]).slice(0, 3)
  const srcCount = data.sources.length

  return (
    <div style={{
      width: 280, backgroundColor: C.evidenceBg, border: `1px solid ${C.evidenceBorder}`,
      borderRadius: 12, fontFamily: 'Inter, sans-serif',
      boxShadow: '0 3px 14px rgba(62,91,163,0.09)'
    }}>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <NodeHeader label="Evidence followed by impact" bg={C.evidenceChip} color={C.white} />
      <div style={{ padding: '10px 14px 14px' }}>
        {items.map((ev) => (
          <div
            key={ev.id}
            onClick={() => data.onEvidenceClick(ev)}
            style={{
              backgroundColor: C.white, border: `1px solid ${C.evidenceBorder}`,
              borderRadius: 8, padding: '8px 11px', marginBottom: 7,
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: '0.62rem', color: C.evidenceChip, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
              {ev.category.replace(/-/g, ' ')}
            </div>
            <p style={{ fontSize: '0.72rem', color: C.navy, lineHeight: 1.55, margin: 0 }}>
              {truncWords(ev.text, 18)}
            </p>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
          <Chip label={`${srcCount} Source${srcCount !== 1 ? 's' : ''}`} bg="rgba(128,144,200,0.18)" color="#6070A0" />
        </div>
      </div>
    </div>
  )
}

// ─── Node: Sources (React Flow) ───────────────────────────────────────────────
function SourcesNodeRF({ data }: { data: any }) {
  const sources = data.sources as Source[]
  return (
    <div style={{
      width: 205,
      backgroundColor: C.white, border: `1px solid ${C.border}`,
      borderRadius: 12, padding: '12px 14px',
      boxShadow: '0 3px 14px rgba(62,91,163,0.09)',
    }}>
      <div style={{ fontSize: '0.62rem', fontWeight: 700, color: C.navy, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 11 }}>
        Sources
      </div>
      {sources.map((s, i) => (
        <div key={s.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 9 }}>
          <div style={{
            width: 18, height: 18, borderRadius: '50%',
            backgroundColor: C.bg, border: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2,
          }}>
            <span style={{ fontSize: '0.5rem', color: C.blue, fontWeight: 700 }}>{i + 1}</span>
          </div>
          {s.url
            ? <a href={s.url} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: '0.68rem', color: C.blue, textDecoration: 'underline', lineHeight: 1.5 }}>
                {s.label}
              </a>
            : <span style={{ fontSize: '0.68rem', color: '#9090B0', fontStyle: 'italic', lineHeight: 1.5 }}>{s.label}</span>
          }
        </div>
      ))}
    </div>
  )
}

const nodeTypes = {
  topic: TopicNodeRF,
  finding: FindingNodeRF,
  evidence: EvidenceNodeRF,
  sources: SourcesNodeRF,
}

// ─── Comparison insight bar (shown when research has real comparison labels) ──
function ComparisonStrip({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null
  const labelA = insights[0].labelA
  const labelB = insights[0].labelB
  // Only show if labels are meaningful (not default placeholder text)
  const isReal = labelA && labelB && labelA !== 'Comparison data 1' && labelB !== 'Comparison data 2'
  if (!isReal) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.45 }}
      style={{
        backgroundColor: C.white, border: `1px solid ${C.border}`,
        borderRadius: 12, padding: '14px 20px',
        marginTop: 12, boxShadow: '0 2px 10px rgba(62,91,163,0.07)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: C.navy }} />
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: C.navy }}>Comparison Insights</span>
        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginLeft: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: C.blue }} />
            <span style={{ fontSize: '0.7rem', color: C.navy, fontStyle: 'italic' }}>{labelA}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: C.teal }} />
            <span style={{ fontSize: '0.7rem', color: C.navy, fontStyle: 'italic' }}>{labelB}</span>
          </div>
        </div>
      </div>

      {/* Metric rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {insights.map((ins, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 90, fontSize: '0.72rem', color: C.navy, fontWeight: 600, flexShrink: 0 }}>
              {ins.metric}
            </div>
            {/* Bar A */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ position: 'relative', height: 10, backgroundColor: C.bg, borderRadius: 999, overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${ins.valueA}%` }}
                  transition={{ duration: 0.6, delay: 0.5 + i * 0.07, ease: 'easeOut' }}
                  style={{ position: 'absolute', left: 0, top: 0, height: '100%', backgroundColor: C.blue, borderRadius: 999 }}
                />
              </div>
              <div style={{ position: 'relative', height: 10, backgroundColor: C.bg, borderRadius: 999, overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${ins.valueB}%` }}
                  transition={{ duration: 0.6, delay: 0.56 + i * 0.07, ease: 'easeOut' }}
                  style={{ position: 'absolute', left: 0, top: 0, height: '100%', backgroundColor: C.teal, borderRadius: 999 }}
                />
              </div>
            </div>
            {/* Values */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 34, alignItems: 'flex-end', flexShrink: 0 }}>
              <span style={{ fontSize: '0.68rem', color: C.blue, fontWeight: 700 }}>{ins.valueA}</span>
              <span style={{ fontSize: '0.68rem', color: C.teal, fontWeight: 700 }}>{ins.valueB}</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ─── Ask ResearchNest panel ── real contextual AI chat ──────────────────────
function AskPanel({ visible, onClose, research }: { visible: boolean; onClose: () => void; research: Research }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input,    setInput   ] = useState('')
  const [loading,  setLoading ] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: ChatMessage = { role: 'user', text }
    const nextHistory = [...messages, userMsg]
    setMessages(nextHistory)
    setInput('')
    setLoading(true)
    setChatError(null)

    try {
      const reply = await sendChatMessage({
        message: text,
        history: messages,
        research: {
          title:        research.title,
          question:     research.question,
          goal:         research.goal,
          domain:       research.domain,
          context:      research.context,
          summary:      research.summary,
          findings:     research.findings,
          evidence:     research.evidence,
          sources:      research.sources,
          relationships: research.relationships,
          insights:     research.insights,
        },
      })
      setMessages([...nextHistory, { role: 'ai', text: reply }])
    } catch (err) {
      setChatError(err instanceof Error ? err.message : 'watsonx.ai could not answer this question.')
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages, research])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 16, scale: 0.97 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 16 }}
          transition={{ duration: 0.25 }}
          style={{
            position: 'relative', width: '100%',
            backgroundColor: C.white, border: `1px solid ${C.border}`,
            borderRadius: 14, boxShadow: '0 6px 28px rgba(62,91,163,0.13)',
            fontFamily: 'Inter, sans-serif', overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px 8px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: C.bg, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <circle cx="5.5" cy="5.5" r="4" stroke={C.blue} strokeWidth="1" />
                  <ellipse cx="5.5" cy="5.5" rx="1.8" ry="4" stroke={C.blue} strokeWidth="0.8" />
                </svg>
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: C.navy }}>Ask ResearchNest</span>
              <span style={{ fontSize: '0.6rem', color: C.teal, fontWeight: 500, backgroundColor: '#DEF2F4', borderRadius: 999, padding: '1px 7px' }}>
                {research.title ? research.title.slice(0, 24) + (research.title.length > 24 ? '…' : '') : 'Research'}
              </span>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9090B0', fontSize: '1rem', lineHeight: 1, padding: '0 2px' }}>×</button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10, height: 340, overflowY: 'auto' }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', paddingTop: 40 }}>
                <div style={{ fontSize: '0.7rem', color: '#9090B0', lineHeight: 1.7 }}>
                  Ask anything about<br />
                  <strong style={{ color: C.blue }}>{research.title || 'your research'}</strong>
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {m.role === 'ai' && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: C.bg, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                      <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                        <circle cx="4.5" cy="4.5" r="3" stroke={C.blue} strokeWidth="0.9" />
                        <ellipse cx="4.5" cy="4.5" rx="1.2" ry="3" stroke={C.blue} strokeWidth="0.7" />
                      </svg>
                    </div>
                    <div style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, borderRadius: '0 10px 10px 10px', padding: '8px 11px', maxWidth: 240, fontSize: '0.68rem', color: C.navy, lineHeight: 1.6 }}>
                      {m.text}
                    </div>
                  </div>
                )}
                {m.role === 'user' && (
                  <div style={{ backgroundColor: C.navy, borderRadius: '10px 0 10px 10px', padding: '7px 11px', maxWidth: 220, fontSize: '0.68rem', color: C.white, lineHeight: 1.5 }}>
                    {m.text}
                  </div>
                )}
              </div>
            ))}
            {chatError && (
              <div role="alert" style={{ backgroundColor: '#FFF0F0', border: '1px solid #F0CCEA', borderRadius: 8, padding: '8px 10px', fontSize: '0.68rem', color: '#A03060', lineHeight: 1.5 }}>
                {chatError}
              </div>
            )}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: C.bg, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                    <circle cx="4.5" cy="4.5" r="3" stroke={C.blue} strokeWidth="0.9" />
                    <ellipse cx="4.5" cy="4.5" rx="1.2" ry="3" stroke={C.blue} strokeWidth="0.7" />
                  </svg>
                </div>
                <div style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, borderRadius: '0 10px 10px 10px', padding: '8px 11px', fontSize: '0.68rem', color: '#9090B0', fontStyle: 'italic', lineHeight: 1.6 }}>
                  Thinking…
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{ padding: '8px 12px 12px', borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: C.bg, border: `1px solid ${C.border}`, borderRadius: 999, padding: '7px 12px' }}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <circle cx="4.5" cy="4.5" r="3.5" stroke={C.teal} strokeWidth="1.1" />
                <path d="M7.5 7.5l2 2" stroke={C.teal} strokeWidth="1.1" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                placeholder={`Ask about ${research.title || 'this research'}…`}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                disabled={loading}
                style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '0.73rem', color: C.navy, fontFamily: 'Inter, sans-serif' }}
              />
              <motion.button
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
                onClick={handleSend}
                disabled={loading || !input.trim()}
                style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: loading ? '#9090B0' : C.navy, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M5 8V2M2 5l3-3 3 3" stroke="#FFF" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Canvas ───────────────────────────────────────────────────────────────────
interface CanvasProps {
  zoom: number
  askOpen: boolean
  setAskOpen: (v: boolean) => void
  findings: Finding[]
  evidence: Evidence[]
  sources: Source[]
  relationships: any[]
  title: string
  domain: string
  onFindingClick: (f: Finding) => void
  onEvidenceClick: (ev: Evidence) => void
}

function ResearchCanvas({ findings, evidence, sources, relationships, title, domain, onFindingClick, onEvidenceClick }: Omit<CanvasProps, 'zoom' | 'askOpen' | 'setAskOpen'>) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  useEffect(() => {
    const initialNodes: Node[] = []
    const initialEdges: Edge[] = []

    // 1. Topic Node
    initialNodes.push({
      id: 'topic',
      type: 'topic',
      position: { x: 400, y: 280 },
      data: { title, domain }
    })

    // 2. Findings
    const positions = [
      { x: 100, y: 80 },
      { x: 480, y: 40 },
      { x: 740, y: 80 },
      { x: 740, y: 430 },
      { x: 100, y: 430 },
      { x: -60, y: 260 }
    ]

    findings.forEach((f, i) => {
      let pos = { x: 0, y: 0 }
      if (i < 6) {
        pos = positions[i]
      } else {
        const angle = (i - 6) * 45 * (Math.PI / 180)
        pos = { x: 400 + Math.cos(angle) * 350, y: 280 + Math.sin(angle) * 250 }
      }
      initialNodes.push({
        id: f.id,
        type: 'finding',
        position: pos,
        data: { finding: f, onExpand: () => onFindingClick(f) }
      })
    })

    // Edges from relationships
    if (relationships && relationships.length > 0) {
      relationships.forEach((rel) => {
        initialEdges.push({
          id: `e-${rel.from}-${rel.to}`,
          source: rel.from,
          target: rel.to,
          type: 'smoothstep',
          label: rel.label,
          labelStyle: { fontSize: 10, fill: '#6878B0' },
          labelBgStyle: { fill: '#EAF1FC', fillOpacity: 0.85 },
          animated: false,
        })
      })
    } else {
      findings.forEach((f) => {
        initialEdges.push({
          id: `e-topic-${f.id}`,
          source: 'topic',
          target: f.id,
          type: 'smoothstep',
          animated: false,
        })
      })
    }

    // 3. Evidence Node
    initialNodes.push({
      id: 'evidence',
      type: 'evidence',
      position: { x: 340, y: 530 },
      data: { evidence, sources, onEvidenceClick }
    })
    initialEdges.push({
      id: `e-topic-evidence`,
      source: 'topic',
      target: 'evidence',
      type: 'smoothstep',
      animated: false,
    })

    // 4. Sources Node (not draggable as per req, wait we can just let it be)
    initialNodes.push({
      id: 'sources',
      type: 'sources',
      position: { x: 820, y: 260 },
      data: { sources },
      draggable: false
    })

    setNodes(initialNodes)
    setEdges(initialEdges)
  }, [title, domain, findings, evidence, sources, relationships, onFindingClick, onEvidenceClick, setNodes, setEdges])

  return (
    <div style={{ height: 520, width: '100%', borderRadius: 14, overflow: 'hidden', border: `1px solid ${C.borderMid}` }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        nodesDraggable
        panOnScroll
        zoomOnScroll
        minZoom={0.3}
        maxZoom={2}
        defaultEdgeOptions={{ type: 'smoothstep', animated: false }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1.2} color="#B5C8DC" />
        <Controls />
      </ReactFlow>
    </div>
  )
}

// ─── Toolbar icon button ──────────────────────────────────────────────────────
function IconBtn({ onClick, title, active = false, children }: {
  onClick?: () => void; title: string; active?: boolean; children: ReactNode
}) {
  return (
    <button onClick={onClick} title={title} style={{
      width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: active ? C.navy : C.white, border: `1px solid ${active ? C.navy : C.border}`,
      borderRadius: 8, cursor: 'pointer', transition: 'background 0.15s, border-color 0.15s',
    }}>
      {children}
    </button>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AnalysisPage() {
  const { research }                   = useResearch()
  const [search,  setSearch          ] = useState('')
  const [zoom,    setZoom            ] = useState(1)
  const [askOpen, setAskOpen         ] = useState(true)
  const [detailFinding, setDetailFinding] = useState<Finding | null>(null)
  const [detailEvidence, setDetailEvidence] = useState<Evidence | null>(null)

  const zoomIn  = () => setZoom(z => Math.min(2,    +(z + 0.15).toFixed(2)))
  const zoomOut = () => setZoom(z => Math.max(0.35, +(z - 0.15).toFixed(2)))
  const zoomFit = () => setZoom(1)

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
      style={{ minHeight: '100vh', backgroundColor: C.bg, fontFamily: 'Inter, system-ui, sans-serif', paddingBottom: 56 }}
    >
      {/* Detail panels (rendered at page level, above everything) */}
      <DetailPanel
        finding={detailFinding}
        evidence={research.evidence}
        sources={research.sources}
        onClose={() => setDetailFinding(null)}
      />
      <EvidenceDetailPanel
        ev={detailEvidence}
        sources={research.sources}
        onClose={() => setDetailEvidence(null)}
      />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 22px' }}>

        {/* ── Status bar ─────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, paddingBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: C.teal, flexShrink: 0 }} />
            <span style={{ fontSize: '0.78rem', color: C.blue, fontStyle: 'italic' }}>
              Analyzing Your entire research on the topic provided…
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <span style={{ fontSize: '0.75rem', color: C.navy }}>Updated</span>
            <span style={{ backgroundColor: C.navy, color: C.white, borderRadius: 999, padding: '2px 9px', fontSize: '0.65rem', fontWeight: 600 }}>
              just now
            </span>
            <span style={{ fontSize: '0.75rem', color: C.navy, fontWeight: 500, marginLeft: 4 }}>Total Findings</span>
            <span style={{ backgroundColor: C.teal, color: C.white, borderRadius: 999, padding: '2px 11px', fontSize: '0.72rem', fontWeight: 700 }}>
              {research.findings.length}
            </span>
            <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: C.bg, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="5.5" stroke={C.blue} strokeWidth="1.1" />
                <ellipse cx="7" cy="7" rx="2.2" ry="5.5" stroke={C.blue} strokeWidth="0.9" />
                <circle cx="7" cy="7" r="1.8" fill={C.blue} />
              </svg>
            </div>
          </div>
        </div>

        {/* ── Topic bar ──────────────────────────────────────────────── */}
        <div style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', marginBottom: 10, boxShadow: '0 1px 4px rgba(62,91,163,0.06)' }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <span style={{ fontSize: '1.1rem', color: '#9090B0', fontStyle: 'italic', fontFamily: 'Caveat, cursive' }}>
              {research.title || 'Research topic'}
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

        {/* ── Summary card ───────────────────────────────────────────── */}
        <div style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 20px 36px', marginBottom: 14, minHeight: 100, boxShadow: '0 1px 4px rgba(62,91,163,0.06)', position: 'relative' }}>
          <span style={{ fontFamily: 'Caveat, cursive', fontSize: '1.35rem', color: C.navy, fontStyle: 'italic' }}>
            {research.summary || research.question || research.context || 'Summary..'}
          </span>
          <div style={{ position: 'absolute', bottom: 12, right: 16 }}>
            <Chip label="Evidence" bg={C.teal} color={C.white} />
          </div>
        </div>

        {/* ── Map workspace ───────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          {/* Canvas takes remaining width */}
          <div style={{ flex: 1, minWidth: 0, border: `1px solid ${C.borderMid}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 18px rgba(62,91,163,0.09)', backgroundColor: C.bg }}>
            {/* Toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 12px', borderBottom: `1px solid ${C.border}`, backgroundColor: C.bg }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: C.white, border: `1px solid ${C.border}`, borderRadius: 999, padding: '5px 12px', cursor: 'text' }}>
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <circle cx="4.5" cy="4.5" r="3.5" stroke={C.blue} strokeWidth="1.2" />
                    <path d="M7.5 7.5l2 2" stroke={C.blue} strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  <input type="text" placeholder="Search the map" value={search} onChange={e => setSearch(e.target.value)}
                    style={{ border: 'none', outline: 'none', fontSize: '0.73rem', color: C.navy, background: 'transparent', width: 118, fontFamily: 'Inter, sans-serif' }} />
                </label>
                <button style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: '5px 13px', fontSize: '0.73rem', color: C.blue, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>Chart</button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <IconBtn title="Zoom in" onClick={zoomIn}>
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 2v7M2 5.5h7" stroke={C.blue} strokeWidth="1.5" strokeLinecap="round" /></svg>
                </IconBtn>
                <IconBtn title="Zoom out" onClick={zoomOut}>
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5h7" stroke={C.blue} strokeWidth="1.5" strokeLinecap="round" /></svg>
                </IconBtn>
                <IconBtn title="Fit to screen" onClick={zoomFit}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 4V1h3M8 1h3v3M1 8v3h3M8 11h3V8" stroke={C.blue} strokeWidth="1.2" strokeLinecap="round" /></svg>
                </IconBtn>
                <IconBtn title="Ask ResearchNest" active={askOpen} onClick={() => setAskOpen(v => !v)}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <circle cx="6" cy="6" r="4.5" stroke={askOpen ? C.white : C.blue} strokeWidth="1.1" />
                    <ellipse cx="6" cy="6" rx="1.8" ry="4.5" stroke={askOpen ? C.white : C.blue} strokeWidth="0.9" />
                    <circle cx="6" cy="6" r="1.5" fill={askOpen ? C.white : C.blue} />
                  </svg>
                </IconBtn>
                <span style={{ fontSize: '0.62rem', color: C.blue, marginLeft: 2, minWidth: 34 }}>
                  {Math.round(zoom * 100)}%
                </span>
              </div>
            </div>
            {/* Canvas */}
            <ResearchCanvas
              findings={research.findings} evidence={research.evidence}
              sources={research.sources} relationships={research.relationships} 
              title={research.title} domain={research.domain}
              onFindingClick={setDetailFinding}
              onEvidenceClick={setDetailEvidence}
            />
          </div>
          {/* Ask panel - fixed width, outside canvas */}
          {askOpen && (
            <div style={{ width: 300, flexShrink: 0 }}>
              <AskPanel visible={askOpen} onClose={() => setAskOpen(false)} research={research} />
            </div>
          )}
        </div>

        {/* ── Comparison strip (only when research has real labelA/labelB) ─ */}
        <ComparisonStrip insights={research.insights} />

      </div>
    </motion.div>
  )
}
