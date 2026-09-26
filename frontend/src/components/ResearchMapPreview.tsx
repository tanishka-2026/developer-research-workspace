import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import gsap from 'gsap'

// ─── Node data matching Figma layout exactly ───────────────────────────────
// Canvas is 860 wide × 420 tall (internal coordinate space)
type Variant = 'topic' | 'main-factor' | 'use-case' | 'limitation' | 'consequence' | 'evidence' | 'ask'

interface NodeDef {
  id: string
  x: number
  y: number
  variant: Variant
  title: string
  subtitle?: string
  bodyLines?: number[]  // skeleton line widths %
}

const NODES: NodeDef[] = [
  // Centre topic
  { id: 'topic',       x: 320, y: 170, variant: 'topic',       title: 'RESEARCH TOPIC', subtitle: 'TOPIC NAME' },
  // Top-right — Use Case
  { id: 'use-case',    x: 530, y: 30,  variant: 'use-case',    title: 'Use Case', subtitle: 'Practical Application', bodyLines: [80, 55] },
  // Mid-right — Limitation (teal)
  { id: 'limitation',  x: 530, y: 150, variant: 'limitation',  title: 'Limitation', subtitle: 'Core Limitation', bodyLines: [85, 60] },
  // Left — Main Factor
  { id: 'main-factor', x: 60,  y: 55,  variant: 'main-factor', title: 'Main Factor', bodyLines: [75, 55, 65, 45] },
  // Bottom-left — Major consequence (purple)
  { id: 'consequence', x: 60,  y: 240, variant: 'consequence', title: 'Major consequence', bodyLines: [80, 60, 70] },
  // Bottom-centre — Evidence label
  { id: 'evidence',    x: 270, y: 320, variant: 'evidence',    title: 'Primary Evidence' },
  // Right — Ask panel
  { id: 'ask',         x: 600, y: 230, variant: 'ask',         title: 'Ask ResearchNest' },
]

// Curved SVG path between two points (cubic bezier)
function curvePath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = (x2 - x1) * 0.55
  return `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`
}

// Node centre helpers (approximate card half-sizes)
const halfW: Record<Variant, number> = {
  topic: 70, 'main-factor': 65, 'use-case': 70, limitation: 70, consequence: 68, evidence: 60, ask: 100,
}
const halfH: Record<Variant, number> = {
  topic: 28, 'main-factor': 48, 'use-case': 40, limitation: 38, consequence: 42, evidence: 16, ask: 70,
}
function cx(n: NodeDef) { return n.x + halfW[n.variant] }
function cy(n: NodeDef) { return n.y + halfH[n.variant] }

const EDGES = [
  { from: 'topic', to: 'use-case' },
  { from: 'topic', to: 'limitation' },
  { from: 'topic', to: 'main-factor' },
  { from: 'topic', to: 'consequence' },
  { from: 'topic', to: 'ask' },
  { from: 'main-factor', to: 'consequence' },
  { from: 'consequence', to: 'evidence' },
]

const variantCard: Record<Variant, React.CSSProperties> = {
  topic:          { backgroundColor: '#0C0D45', border: '2px solid #3E5BA3', borderRadius: 10, minWidth: 140, color: '#fff' },
  'main-factor':  { backgroundColor: '#FFFFFF', border: '1px solid #DAE8FB', borderRadius: 8, minWidth: 130 },
  'use-case':     { backgroundColor: '#FFFFFF', border: '1px solid #DAE8FB', borderRadius: 8, minWidth: 140 },
  limitation:     { backgroundColor: '#75CBD1', border: '1px solid #5BBFC6', borderRadius: 8, minWidth: 140 },
  consequence:    { backgroundColor: '#F2D2FF', border: '1px solid #E5BAFF', borderRadius: 8, minWidth: 136 },
  evidence:       { backgroundColor: '#FFFFFF', border: '1px solid #DAE8FB', borderRadius: 6, minWidth: 120 },
  ask:            { backgroundColor: '#FFFFFF', border: '1px solid #DAE8FB', borderRadius: 10, minWidth: 200 },
}

function SkeletonLines({ widths, color }: { widths: number[]; color: string }) {
  return (
    <div className="flex flex-col gap-1 mt-1.5">
      {widths.map((w, i) => (
        <div key={i} style={{ height: 4, borderRadius: 99, backgroundColor: color, width: `${w}%` }} />
      ))}
    </div>
  )
}

export default function ResearchMapPreview() {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current) return
    const paths = svgRef.current.querySelectorAll<SVGPathElement>('path')
    paths.forEach((p, i) => {
      const len = p.getTotalLength()
      gsap.set(p, { strokeDasharray: len, strokeDashoffset: len })
      gsap.to(p, { strokeDashoffset: 0, duration: 0.8, delay: 0.4 + i * 0.06, ease: 'power2.out' })
    })
  }, [])

  const nodeMap = Object.fromEntries(NODES.map((n) => [n.id, n]))

  return (
    <section
      className="w-full text-center"
      style={{
        backgroundColor: '#EAF1FC',
        fontFamily: 'Inter, system-ui, sans-serif',
        paddingTop: '72px',
        paddingBottom: '80px',
      }}
    >
      <div className="max-w-5xl mx-auto px-6">
        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          style={{
            color: '#0C0D45',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 'clamp(1.35rem, 3vw, 1.75rem)',
            fontWeight: 700,
            margin: '0 0 10px',
          }}
        >
          See how everything connects.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.08 }}
          style={{ color: '#3E5BA3', fontSize: '0.875rem', margin: '0 0 0 0' }}
        >
          ResearchNest connects findings, evidence, and sources so you can understand the bigger
          <br className="hidden sm:block" /> picture instead of reading isolated pieces of information.
        </motion.p>

        {/* ── Map workspace ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.15 }}
          className="rounded-2xl mx-auto mt-10"
          style={{
            backgroundColor: '#EAF1FC',
            border: '1px solid #C9DCEF',
            boxShadow: '0 2px 20px rgba(62,91,163,0.1)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* ─ Top toolbar — normal flow, not absolute ─ */}
          <div
            className="flex items-center justify-between px-3 py-2 flex-shrink-0"
            style={{ borderBottom: '1px solid #D5E6F7', backgroundColor: '#EAF1FC' }}
          >
            {/* Search + Chat buttons left */}
            <div className="flex items-center gap-1.5">
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #DAE8FB', color: '#3E5BA3' }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <circle cx="4" cy="4" r="3" stroke="#3E5BA3" strokeWidth="1.2" />
                  <path d="M7 7l2 2" stroke="#3E5BA3" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                Search the map
              </div>
              <div
                className="px-2.5 py-1 rounded-lg text-xs"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #DAE8FB', color: '#3E5BA3' }}
              >
                Chat
              </div>
            </div>
            {/* Right toolbar icons */}
            <div className="flex items-center gap-1.5">
              {[
                // zoom-in
                <svg key="zi" width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="4.5" cy="4.5" r="3.5" stroke="#3E5BA3" strokeWidth="1.2"/><path d="M3 4.5h3M4.5 3v3M7.5 7.5l1.5 1.5" stroke="#3E5BA3" strokeWidth="1.1" strokeLinecap="round"/></svg>,
                // zoom-out
                <svg key="zo" width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="4.5" cy="4.5" r="3.5" stroke="#3E5BA3" strokeWidth="1.2"/><path d="M3 4.5h3M7.5 7.5l1.5 1.5" stroke="#3E5BA3" strokeWidth="1.1" strokeLinecap="round"/></svg>,
                // fit
                <svg key="fit" width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 3V1h2M7 1h2v2M1 7v2h2M7 9h2V7" stroke="#3E5BA3" strokeWidth="1.1" strokeLinecap="round"/></svg>,
                // grid
                <svg key="grid" width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 4h8M4 1v8" stroke="#3E5BA3" strokeWidth="1.1" strokeLinecap="round"/></svg>,
                // share
                <svg key="share" width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="8" cy="2" r="1.5" stroke="#3E5BA3" strokeWidth="1.1"/><circle cx="2" cy="5" r="1.5" stroke="#3E5BA3" strokeWidth="1.1"/><circle cx="8" cy="8" r="1.5" stroke="#3E5BA3" strokeWidth="1.1"/><path d="M3.5 4.2L6.5 2.8M3.5 5.8l3 1.4" stroke="#3E5BA3" strokeWidth="1.1"/></svg>,
              ].map((icon, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded flex items-center justify-center"
                  style={{ backgroundColor: '#FFFFFF', border: '1px solid #DAE8FB' }}
                >
                  {icon}
                </div>
              ))}
            </div>
          </div>

          {/* ─ Canvas body ─ */}
          {/* overflowX:auto lets wide node layouts scroll rather than clip */}
          <div style={{ overflowX: 'auto', overflowY: 'visible', flex: 1 }}>
          <div style={{ position: 'relative', minWidth: 840, height: 420 }}>

            {/* Dot-grid */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.5 }}>
              <defs>
                <pattern id="mapgrid" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="1" fill="#C0D6EE" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#mapgrid)" />
            </svg>

            {/* ─ Curved edge paths ─ */}
            <svg
              ref={svgRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ overflow: 'visible' }}
            >
              {EDGES.map((e) => {
                const f = nodeMap[e.from], t = nodeMap[e.to]
                return (
                  <path
                    key={`${e.from}-${e.to}`}
                    d={curvePath(cx(f), cy(f), cx(t), cy(t))}
                    stroke="#B8CEDE"
                    strokeWidth="1.5"
                    fill="none"
                    strokeLinecap="round"
                  />
                )
              })}
            </svg>

            {/* ─ Node cards ─ */}
            {NODES.map((node, i) => (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, scale: 0.88 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.32, delay: 0.35 + i * 0.07 }}
                className="absolute px-3 py-2"
                style={{ left: node.x, top: node.y, ...variantCard[node.variant] }}
              >
                {node.variant === 'topic' && (
                  <>
                    <div style={{ fontSize: '0.6rem', color: 'rgba(218,232,251,0.7)', fontWeight: 400, letterSpacing: '0.05em', marginBottom: 2 }}>
                      {node.title}
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.03em' }}>
                      {node.subtitle}
                    </div>
                  </>
                )}

                {node.variant === 'ask' && (
                  <>
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#EAF1FC' }}>
                        <svg width="7" height="7" viewBox="0 0 7 7" fill="none"><circle cx="3.5" cy="3.5" r="2.5" stroke="#3E5BA3" strokeWidth="1"/></svg>
                      </div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#0C0D45' }}>{node.title}</span>
                    </div>
                    {/* highlighted topic chip */}
                    <div className="mb-1.5 px-2 py-0.5 rounded text-xs inline-block" style={{ backgroundColor: '#EAF1FC', color: '#3E5BA3', fontSize: '0.6rem' }}>
                      Topic: Research has not understood API
                    </div>
                    <div style={{ fontSize: '0.62rem', color: '#3E5BA3', lineHeight: 1.5, marginBottom: 8 }}>
                      An API (Application Programming Interface) is a set of rules and protocols that allows different software applications to communicate and exchange data with each other…
                    </div>
                    <button className="text-xs underline mb-2" style={{ color: '#3E5BA3', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '0.6rem' }}>
                      How is it used in large systems?
                    </button>
                    {/* Input row */}
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="flex-1 flex items-center gap-1 px-2 py-1 rounded-full" style={{ backgroundColor: '#EAF1FC', border: '1px solid #DAE8FB' }}>
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><circle cx="3.5" cy="3.5" r="2.5" stroke="#75CBD1" strokeWidth="1"/><path d="M5.5 5.5l1.5 1.5" stroke="#75CBD1" strokeWidth="1" strokeLinecap="round"/></svg>
                        <span style={{ fontSize: '0.6rem', color: '#75CBD1' }}>Ask ResearchNest</span>
                      </div>
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#0C0D45' }}>
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M2 4h4M4.5 2l2 2-2 2" stroke="#fff" strokeWidth="1.2" strokeLinecap="round"/></svg>
                      </div>
                    </div>
                  </>
                )}

                {node.variant === 'evidence' && (
                  <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#3E5BA3' }}>{node.title}</div>
                )}

                {!['topic', 'ask', 'evidence'].includes(node.variant) && (
                  <>
                    <div style={{
                      fontSize: '0.68rem', fontWeight: 600,
                      color: node.variant === 'limitation' ? '#0C0D45' : node.variant === 'consequence' ? '#5A2D82' : '#0C0D45',
                      marginBottom: 2,
                    }}>
                      {node.title}
                    </div>
                    {node.subtitle && (
                      <div style={{ fontSize: '0.6rem', color: node.variant === 'limitation' ? 'rgba(12,13,69,0.65)' : '#3E5BA3', marginBottom: 3 }}>
                        {node.subtitle}
                      </div>
                    )}
                    {node.bodyLines && (
                      <SkeletonLines
                        widths={node.bodyLines}
                        color={
                          node.variant === 'limitation'  ? 'rgba(12,13,69,0.18)' :
                          node.variant === 'consequence' ? 'rgba(90,45,130,0.18)' :
                          '#DAE8FB'
                        }
                      />
                    )}
                    {/* Small action buttons on use-case and main-factor cards */}
                    {(node.variant === 'main-factor' || node.variant === 'use-case') && (
                      <div className="flex gap-1 mt-2">
                        {['•••', '→'].map((s, i) => (
                          <div key={i} className="px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: '#EAF1FC', color: '#3E5BA3', fontSize: '0.55rem' }}>
                            {s}
                          </div>
                        ))}
                      </div>
                    )}
                    {node.variant === 'limitation' && (
                      <div className="mt-2">
                        <div className="px-2 py-0.5 rounded text-xs inline-block" style={{ backgroundColor: 'rgba(255,255,255,0.5)', color: '#0C0D45', fontSize: '0.55rem' }}>
                          Summary
                        </div>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            ))}
          </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
