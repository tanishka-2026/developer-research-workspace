// ResearchNest – Analysis / Research Map page  (route: /analysis)
import { useState, useRef, useEffect } from 'react'
import type { ReactNode } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import gsap from 'gsap'

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

// ─── Mock data ────────────────────────────────────────────────────────────────
const DATA = {
  topic:         'TOPIC NAME',
  domain:        'Domain',
  sourceCount:   4,
  totalFindings: 10,
  summary:       'Summary..',
  updatedAgo:    '2h ago',
}

// ─── Canvas geometry ──────────────────────────────────────────────────────────
// Internal canvas coordinate space — large enough to fit all nodes + Ask panel
const CW = 1180
const CH = 680

// ─── S-curve cubic-bezier path ────────────────────────────────────────────────
function epath(x1: number, y1: number, x2: number, y2: number): string {
  if (Math.abs(x2 - x1) >= Math.abs(y2 - y1)) {
    const mx = (x1 + x2) / 2
    return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`
  }
  const my = (y1 + y2) / 2
  return `M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`
}

// ─── Edges [x1,y1 → x2,y2] — tuned to match Figma node positions ──────────
const EDGES: Array<[number, number, number, number]> = [
  [435, 335, 330, 195],    // Topic → Main Factor (right-mid → card bottom)
  [505, 310, 590, 130],    // Topic → Use Case
  [530, 310, 800, 145],    // Topic → Limitations
  [510, 380, 610, 465],    // Topic → Alternative
  [240, 280, 215, 400],    // Main Factor → Impact
  [145, 195, 120, 325],    // Main Factor → Discovery
  [285, 500, 330, 568],    // Impact → Evidence node
]

// ─── Chip ─────────────────────────────────────────────────────────────────────
function Chip({ label, bg, color, border }: {
  label: string; bg: string; color: string; border?: string
}) {
  return (
    <span style={{
      display: 'inline-block', backgroundColor: bg, color,
      border: border ? `1px solid ${border}` : 'none',
      borderRadius: 999, padding: '2.5px 10px',
      fontSize: '0.63rem', fontFamily: 'Inter, sans-serif',
      fontWeight: 500, whiteSpace: 'nowrap', lineHeight: 1.7,
    }}>
      {label}
    </span>
  )
}

// ─── Bullet row ───────────────────────────────────────────────────────────────
function BulletRow({ label, color }: { label: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
      <span style={{ fontSize: '0.7rem', color: C.blue, fontFamily: 'Inter, sans-serif', flexShrink: 0, fontWeight: 500 }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 11, borderRadius: 5, backgroundColor: color, opacity: 0.35, maxWidth: 80 }} />
    </div>
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

// ─── Generic node card wrapper ────────────────────────────────────────────────
function NodeCard({ x, y, w, bg = C.white, border = C.border, delay = 0.2, children }: {
  x: number; y: number; w: number; bg?: string; border?: string; delay?: number; children: ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.32, delay }}
      style={{
        position: 'absolute', left: x, top: y, width: w,
        backgroundColor: bg, border: `1px solid ${border}`,
        borderRadius: 12, fontFamily: 'Inter, sans-serif',
        boxShadow: '0 3px 14px rgba(62,91,163,0.09)',
      }}
    >
      {children}
    </motion.div>
  )
}

// ─── Node: Central Topic ──────────────────────────────────────────────────────
function TopicNode() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.82 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.42, delay: 0.1 }}
      style={{
        position: 'absolute', left: 410, top: 290, width: 200,
        backgroundColor: C.navy, border: `2px solid ${C.blue}`,
        borderRadius: 20, padding: '20px 22px 22px', textAlign: 'center',
        userSelect: 'none', boxShadow: '0 6px 28px rgba(12,13,69,0.30)',
      }}
    >
      <div style={{ fontSize: '0.55rem', color: 'rgba(218,232,251,0.55)', letterSpacing: '0.12em', marginBottom: 7, textTransform: 'uppercase', fontWeight: 600 }}>
        Research Topic
      </div>
      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFF', letterSpacing: '0.05em', lineHeight: 1.15, textTransform: 'uppercase' }}>
        {DATA.topic}
      </div>
    </motion.div>
  )
}

// ─── Node: Main Factor ────────────────────────────────────────────────────────
function MainFactorNode() {
  return (
    <NodeCard x={150} y={80} w={210} delay={0.18}>
      <NodeHeader label="Core Contribution factors" bg={C.navy} color={C.white} />
      <div style={{ padding: '10px 14px 13px' }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: C.navy, marginBottom: 10 }}>Main Factor</div>
        <BulletRow label="Factor 1" color="#7880CC" />
        <BulletRow label="Factor 2" color="#7880CC" />
        <BulletRow label="Factor 3" color="#7880CC" />
        <div style={{ fontSize: '0.65rem', color: '#9090B0', marginTop: 8, marginBottom: 11, fontStyle: 'italic' }}>Summary...</div>
        <div style={{ display: 'flex', gap: 5 }}>
          <Chip label="tags"     bg="transparent"       color={C.purpleChip}  border={C.purpleChip} />
          <Chip label="Evidence" bg={C.teal}             color={C.white} />
        </div>
      </div>
    </NodeCard>
  )
}

// ─── Node: Important Discovery (dark slate card, far left) ───────────────────
function DiscoveryNode() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: 0.28 }}
      style={{
        position: 'absolute', left: 10, top: 310, width: 178,
        backgroundColor: C.darkCard, border: `1px solid ${C.darkCardBorder}`,
        borderRadius: 12, padding: '12px 14px',
        boxShadow: '0 4px 16px rgba(30,30,90,0.22)',
      }}
    >
      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#FFF', marginBottom: 9 }}>Important discovery</div>
      <div style={{
        backgroundColor: 'rgba(255,255,255,0.09)', borderRadius: 7,
        padding: '6px 9px', fontSize: '0.65rem',
        color: 'rgba(255,255,255,0.38)', fontStyle: 'italic', marginBottom: 11,
      }}>
        Answer
      </div>
      <div style={{ display: 'flex', gap: 5 }}>
        <Chip label="Sources"  bg="rgba(255,255,255,0.13)" color="rgba(255,255,255,0.70)" />
        <Chip label="Evidence" bg="rgba(117,203,209,0.25)" color={C.teal} />
      </div>
    </motion.div>
  )
}

// ─── Node: Impact (bottom-left) ───────────────────────────────────────────────
function ImpactNode() {
  return (
    <NodeCard x={148} y={396} w={210} delay={0.24}>
      <NodeHeader label="Impact" bg="#D4AAEE" color={C.navy} />
      <div style={{ padding: '10px 14px 13px' }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: C.navy, marginBottom: 10 }}>Major consequence</div>
        <BulletRow label="Impact 1" color="#D4AAEE" />
        <BulletRow label="Impact 2" color="#D4AAEE" />
        <BulletRow label="Impact 3" color="#D4AAEE" />
        <div style={{ fontSize: '0.65rem', color: '#9090B0', marginTop: 8, marginBottom: 11, fontStyle: 'italic' }}>Summary...</div>
        <div style={{ display: 'flex', gap: 5 }}>
          <Chip label="tags"     bg="transparent" color={C.purpleChip} border={C.purpleChip} />
          <Chip label="Evidence" bg={C.teal}       color={C.white} />
        </div>
      </div>
    </NodeCard>
  )
}

// ─── Node: Use Case (top-right) ───────────────────────────────────────────────
function UseCaseNode() {
  return (
    <NodeCard x={570} y={40} w={190} delay={0.2}>
      <NodeHeader label="Use Case" bg="#EAA8D8" color={C.navy} />
      <div style={{ padding: '10px 14px 13px' }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: C.navy, marginBottom: 10 }}>Practical Application</div>
        <div style={{
          backgroundColor: C.pinkBg, border: `1px solid ${C.pinkBorder}`,
          borderRadius: 8, padding: '8px 10px',
          fontSize: '0.65rem', color: '#B080C0', fontStyle: 'italic',
          marginBottom: 11, minHeight: 58,
        }}>
          Summary...
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          <Chip label="tags"     bg="transparent" color={C.purpleChip} border={C.purpleChip} />
          <Chip label="Evidence" bg={C.teal}       color={C.white} />
        </div>
      </div>
    </NodeCard>
  )
}

// ─── Node: Limitations (top-far-right, teal) ─────────────────────────────────
function LimitationsNode() {
  return (
    <NodeCard x={790} y={55} w={220} bg={C.tealCardBg} border={C.tealCardBorder} delay={0.26}>
      <NodeHeader label="Limitations" bg={C.teal} color={C.white} />
      <div style={{ padding: '10px 14px 13px' }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: C.navy, marginBottom: 10 }}>Core Limitaton</div>
        <div style={{
          backgroundColor: C.tealMed, borderRadius: 8,
          padding: '8px 10px', fontSize: '0.65rem',
          color: '#1E6070', fontStyle: 'italic', marginBottom: 8,
        }}>
          Answer
        </div>
        <div style={{ fontSize: '0.65rem', color: '#3E8090', fontStyle: 'italic', marginBottom: 11 }}>Summary...</div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Chip label="Evidence" bg={C.teal} color={C.white} />
        </div>
      </div>
    </NodeCard>
  )
}

// ─── Node: Evidence followed by Impact (bottom-center) ───────────────────────
function EvidenceNode() {
  return (
    <NodeCard x={360} y={558} w={190} bg={C.evidenceBg} border={C.evidenceBorder} delay={0.34}>
      <NodeHeader label="Evidence followed by impact" bg={C.evidenceChip} color={C.white} />
      <div style={{ padding: '10px 14px 13px' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: C.navy, marginBottom: 4, fontStyle: 'italic' }}>Evidence</div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
          <Chip label="Sources" bg="rgba(128,144,200,0.18)" color="#6070A0" />
        </div>
      </div>
    </NodeCard>
  )
}

// ─── Node: Alternative (right-bottom, partially behind Ask panel) ─────────────
function AlternativeNode() {
  return (
    <NodeCard x={590} y={430} w={200} delay={0.3}>
      <NodeHeader label="Alternative" bg="#E8A8D8" color={C.navy} />
      <div style={{ padding: '10px 14px 13px' }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: C.navy, marginBottom: 8 }}>Alternative Approach</div>
        <div style={{
          backgroundColor: '#F4F4FA', border: `1px solid ${C.border}`,
          borderRadius: 7, padding: '7px 10px',
          fontSize: '0.65rem', color: '#9090B0', fontStyle: 'italic', marginBottom: 7,
        }}>
          Answer
        </div>
        <div style={{ fontSize: '0.65rem', color: '#9090B0', fontStyle: 'italic', marginBottom: 9 }}>Summary...</div>
        <div style={{ display: 'flex', gap: 5 }}>
          <Chip label="tags"     bg="transparent" color={C.purpleChip} border={C.purpleChip} />
          <Chip label="Evidence" bg={C.teal}       color={C.white} />
        </div>
      </div>
    </NodeCard>
  )
}

// ─── Ask ResearchNest floating panel (overlaid on canvas, right side) ─────────
function AskPanel({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [input, setInput] = useState('')
  const chatMessages = [
    { role: 'user',  text: 'Hello, ResearchNest help me understand API' },
    {
      role: 'ai',
      text: 'An API (Application Programming Interface) is a set of rules and protocols that allows different software applications to communicate and exchange data with one another. Essentially, it acts as an invisible digital messenger, taking a request from one system, delivering it to another, and bringing back the response',
    },
    { role: 'user',  text: 'How is it used in Graph section?' },
    { role: 'ai',    text: 'Analyzing...' },
  ]

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 30, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 30 }}
          transition={{ duration: 0.28 }}
          style={{
            position: 'absolute',
            right: 12, bottom: 12,
            width: 310,
            backgroundColor: C.white,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            boxShadow: '0 8px 32px rgba(62,91,163,0.16)',
            fontFamily: 'Inter, sans-serif',
            zIndex: 20,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px 8px',
            borderBottom: `1px solid ${C.border}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                backgroundColor: C.bg, border: `1px solid ${C.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <circle cx="5.5" cy="5.5" r="4" stroke={C.blue} strokeWidth="1" />
                  <ellipse cx="5.5" cy="5.5" rx="1.8" ry="4" stroke={C.blue} strokeWidth="0.8" />
                </svg>
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: C.navy }}>Ask ResearchNest</span>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9090B0', fontSize: '1rem', lineHeight: 1, padding: '0 2px' }}
              title="Close"
            >
              ×
            </button>
          </div>

          {/* Chat thread */}
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 320, overflowY: 'auto' }}>
            {chatMessages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {m.role === 'ai' && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%',
                      backgroundColor: C.bg, border: `1px solid ${C.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2,
                    }}>
                      <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                        <circle cx="4.5" cy="4.5" r="3" stroke={C.blue} strokeWidth="0.9" />
                        <ellipse cx="4.5" cy="4.5" rx="1.2" ry="3" stroke={C.blue} strokeWidth="0.7" />
                      </svg>
                    </div>
                    <div style={{
                      backgroundColor: C.bg, border: `1px solid ${C.border}`,
                      borderRadius: '0 10px 10px 10px',
                      padding: '8px 11px', maxWidth: 220,
                      fontSize: '0.68rem', color: C.navy, lineHeight: 1.55,
                    }}>
                      {m.text === 'Analyzing...'
                        ? <span style={{ color: '#9090B0', fontStyle: 'italic' }}>Analyzing...</span>
                        : m.text
                      }
                    </div>
                  </div>
                )}
                {m.role === 'user' && (
                  <div style={{
                    backgroundColor: C.navy,
                    borderRadius: '10px 0 10px 10px',
                    padding: '7px 11px', maxWidth: 210,
                    fontSize: '0.68rem', color: C.white, lineHeight: 1.5,
                  }}>
                    {m.text}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Input bar */}
          <div style={{ padding: '8px 12px 12px', borderTop: `1px solid ${C.border}` }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              backgroundColor: C.bg, border: `1px solid ${C.border}`,
              borderRadius: 999, padding: '7px 12px',
            }}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <circle cx="4.5" cy="4.5" r="3.5" stroke={C.teal} strokeWidth="1.1" />
                <path d="M7.5 7.5l2 2" stroke={C.teal} strokeWidth="1.1" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                placeholder="Ask Searchflow"
                value={input}
                onChange={e => setInput(e.target.value)}
                style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '0.73rem', color: C.navy, fontFamily: 'Inter, sans-serif' }}
              />
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                style={{
                  width: 26, height: 26, borderRadius: '50%',
                  backgroundColor: C.navy, border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}
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

// ─── Research canvas (grid + edges + nodes + Ask panel) ──────────────────────
function ResearchCanvas({ zoom, askOpen, setAskOpen }: { zoom: number; askOpen: boolean; setAskOpen: (v: boolean) => void }) {
  const edgeRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const svg = edgeRef.current
    if (!svg) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const paths = svg.querySelectorAll<SVGPathElement>('path[data-e]')
    paths.forEach((p, i) => {
      const len = p.getTotalLength()
      gsap.set(p, { strokeDasharray: len, strokeDashoffset: len })
      gsap.to(p, { strokeDashoffset: 0, duration: 0.7, delay: 0.55 + i * 0.07, ease: 'power2.out' })
    })
  }, [])

  return (
    <div style={{ overflow: 'auto' }}>
      {/* Sized layout wrapper for scroll */}
      <div style={{ position: 'relative', width: CW * zoom, height: CH * zoom, flexShrink: 0, minHeight: 480 }}>
        {/* Scaled canvas */}
        <div style={{
          position: 'absolute', top: 0, left: 0, width: CW, height: CH,
          transform: `scale(${zoom})`, transformOrigin: 'top left',
        }}>
          {/* Dot grid */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.6 }}>
            <defs>
              <pattern id="rn-dots" x="0" y="0" width="26" height="26" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="1.1" fill="#B5C8DC" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#rn-dots)" />
          </svg>

          {/* Edge SVG with GSAP draw animation */}
          <svg
            ref={edgeRef}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}
          >
            <defs>
              <marker id="rn-arrow" markerWidth="7" markerHeight="6" refX="6" refY="3" orient="auto">
                <polygon points="0 0,7 3,0 6" fill="#6878B0" />
              </marker>
            </defs>
            {EDGES.map(([x1, y1, x2, y2], i) => (
              <path
                key={i}
                data-e="1"
                d={epath(x1, y1, x2, y2)}
                stroke="#6878B0"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                markerEnd="url(#rn-arrow)"
              />
            ))}
          </svg>

          {/* Node cards */}
          <TopicNode />
          <MainFactorNode />
          <DiscoveryNode />
          <ImpactNode />
          <EvidenceNode />
          <UseCaseNode />
          <LimitationsNode />
          <AlternativeNode />

          {/* Ask ResearchNest floating panel — overlaid on canvas, bottom-right */}
          <AskPanel visible={askOpen} onClose={() => setAskOpen(false)} />
        </div>
      </div>
    </div>
  )
}

// ─── Toolbar icon button ──────────────────────────────────────────────────────
function IconBtn({ onClick, title, active = false, children }: {
  onClick?: () => void; title: string; active?: boolean; children: ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 30, height: 30,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: active ? C.navy : C.white,
        border: `1px solid ${active ? C.navy : C.border}`,
        borderRadius: 8, cursor: 'pointer',
        transition: 'background 0.15s, border-color 0.15s',
      }}
    >
      {children}
    </button>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AnalysisPage() {
  const [search,  setSearch ] = useState('')
  const [zoom,    setZoom   ] = useState(1)
  const [askOpen, setAskOpen] = useState(true)   // Ask panel open by default (matches Figma)

  const zoomIn  = () => setZoom(z => Math.min(2,    +(z + 0.15).toFixed(2)))
  const zoomOut = () => setZoom(z => Math.max(0.35, +(z - 0.15).toFixed(2)))
  const zoomFit = () => setZoom(1)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{ minHeight: '100vh', backgroundColor: C.bg, fontFamily: 'Inter, system-ui, sans-serif', paddingBottom: 56 }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 22px' }}>

        {/* ── Status bar ─────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, paddingBottom: 8 }}>
          {/* Left: pulse + italic status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: C.teal, flexShrink: 0 }} />
            <span style={{ fontSize: '0.78rem', color: C.blue, fontStyle: 'italic' }}>
              Analyzing Your entire research on the topic provided.....
            </span>
          </div>
          {/* Right: Updated badge + Total Findings + avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <span style={{ fontSize: '0.75rem', color: C.navy }}>Updated</span>
            <span style={{
              backgroundColor: C.navy, color: C.white,
              borderRadius: 999, padding: '2px 9px',
              fontSize: '0.65rem', fontWeight: 600,
            }}>
              {DATA.updatedAgo}
            </span>
            <span style={{ fontSize: '0.75rem', color: C.navy, fontWeight: 500, marginLeft: 4 }}>Total Findings</span>
            <span style={{
              backgroundColor: C.teal, color: C.white,
              borderRadius: 999, padding: '2px 11px',
              fontSize: '0.72rem', fontWeight: 700,
            }}>
              {DATA.totalFindings}
            </span>
            {/* Avatar icon */}
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              backgroundColor: C.bg, border: `1px solid ${C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="5.5" stroke={C.blue} strokeWidth="1.1" />
                <ellipse cx="7" cy="7" rx="2.2" ry="5.5" stroke={C.blue} strokeWidth="0.9" />
                <circle cx="7" cy="7" r="1.8" fill={C.blue} />
              </svg>
            </div>
          </div>
        </div>

        {/* ── Research topic bar ─────────────────────────────────────── */}
        <div style={{
          backgroundColor: C.white, border: `1px solid ${C.border}`,
          borderRadius: 10, padding: '10px 16px',
          display: 'flex', alignItems: 'center',
          marginBottom: 10, boxShadow: '0 1px 4px rgba(62,91,163,0.06)',
        }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <span style={{ fontSize: '1.1rem', color: '#9090B0', fontStyle: 'italic', fontFamily: 'Caveat, cursive' }}>
              Research topic
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {/* Source count pill */}
            <div style={{
              backgroundColor: C.navy, color: C.white,
              borderRadius: 999, padding: '5px 14px',
              fontSize: '0.73rem', fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              Source count
              <span style={{
                backgroundColor: C.blue, color: C.white, borderRadius: '50%',
                width: 20, height: 20,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.65rem', fontWeight: 700,
              }}>
                {DATA.sourceCount}
              </span>
            </div>
            {/* Domain pill */}
            <div style={{
              backgroundColor: C.teal, color: C.white,
              borderRadius: 999, padding: '5px 14px',
              fontSize: '0.73rem', fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 7,
            }}>
              Domain
              <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: C.navy }} />
            </div>
          </div>
        </div>

        {/* ── Summary card ───────────────────────────────────────────── */}
        <div style={{
          backgroundColor: C.white, border: `1px solid ${C.border}`,
          borderRadius: 10, padding: '16px 20px 36px',
          marginBottom: 14, minHeight: 100,
          boxShadow: '0 1px 4px rgba(62,91,163,0.06)', position: 'relative',
        }}>
          <span style={{ fontFamily: 'Caveat, cursive', fontSize: '1.35rem', color: C.navy, fontStyle: 'italic' }}>
            {DATA.summary}
          </span>
          {/* Evidence chip — bottom-right */}
          <div style={{ position: 'absolute', bottom: 12, right: 16 }}>
            <Chip label="Evidence" bg={C.teal} color={C.white} />
          </div>
        </div>

        {/* ── Map workspace ───────────────────────────────────────────── */}
        <div style={{
          border: `1px solid ${C.borderMid}`,
          borderRadius: 14, overflow: 'hidden',
          boxShadow: '0 2px 18px rgba(62,91,163,0.09)',
          backgroundColor: C.bg,
        }}>
          {/* Toolbar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '7px 12px', borderBottom: `1px solid ${C.border}`,
            backgroundColor: C.bg,
          }}>
            {/* Left: search + Chart button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{
                display: 'flex', alignItems: 'center', gap: 6,
                backgroundColor: C.white, border: `1px solid ${C.border}`,
                borderRadius: 999, padding: '5px 12px', cursor: 'text',
              }}>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <circle cx="4.5" cy="4.5" r="3.5" stroke={C.blue} strokeWidth="1.2" />
                  <path d="M7.5 7.5l2 2" stroke={C.blue} strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                <input
                  type="text"
                  placeholder="Search the map"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ border: 'none', outline: 'none', fontSize: '0.73rem', color: C.navy, background: 'transparent', width: 118, fontFamily: 'Inter, sans-serif' }}
                />
              </label>
              <button style={{
                backgroundColor: C.white, border: `1px solid ${C.border}`,
                borderRadius: 8, padding: '5px 13px',
                fontSize: '0.73rem', color: C.blue, cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', fontWeight: 500,
              }}>
                Chart
              </button>
            </div>

            {/* Right: zoom + controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {/* Magnifier icon */}
              <IconBtn title="Zoom search">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="5" cy="5" r="4" stroke={C.blue} strokeWidth="1.3" />
                  <path d="M3.5 5h3M5 3.5v3M8.5 8.5l2 2" stroke={C.blue} strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </IconBtn>
              {/* Menu lines */}
              <IconBtn title="Options">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M1 3h10M1 6h10M1 9h10" stroke={C.blue} strokeWidth="1.3" strokeLinecap="round" />
                </svg>
              </IconBtn>
              {/* Plus / zoom in */}
              <IconBtn title="Zoom in" onClick={zoomIn}>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M5.5 2v7M2 5.5h7" stroke={C.blue} strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </IconBtn>
              {/* Minus / zoom out */}
              <IconBtn title="Zoom out" onClick={zoomOut}>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M2 5.5h7" stroke={C.blue} strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </IconBtn>
              {/* Fit / full screen */}
              <IconBtn title="Fit to screen" onClick={zoomFit}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M1 4V1h3M8 1h3v3M1 8v3h3M8 11h3V8" stroke={C.blue} strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </IconBtn>
              {/* Expand arrows */}
              <IconBtn title="Expand">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M1 1l4 4M1 3V1h2M7 1l4 4M9 1h2v2M1 11l4-4M1 9v2h2M11 11l-4-4M9 11h2V9" stroke={C.blue} strokeWidth="1.1" strokeLinecap="round" />
                </svg>
              </IconBtn>
              {/* Ask ResearchNest toggle */}
              <IconBtn title="Ask ResearchNest" active={askOpen} onClick={() => setAskOpen(v => !v)}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="4.5" stroke={askOpen ? C.white : C.blue} strokeWidth="1.1" />
                  <ellipse cx="6" cy="6" rx="1.8" ry="4.5" stroke={askOpen ? C.white : C.blue} strokeWidth="0.9" />
                  <circle cx="6" cy="6" r="1.5" fill={askOpen ? C.white : C.blue} />
                </svg>
              </IconBtn>
              {/* Zoom % label */}
              <span style={{ fontSize: '0.62rem', color: C.blue, marginLeft: 2, minWidth: 34 }}>
                {Math.round(zoom * 100)}%
              </span>
            </div>
          </div>

          {/* Canvas */}
          <ResearchCanvas zoom={zoom} askOpen={askOpen} setAskOpen={setAskOpen} />
        </div>

      </div>
    </motion.div>
  )
}
