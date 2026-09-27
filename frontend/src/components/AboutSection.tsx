// ResearchNest – About section (landing page anchor: #about)
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'

const C = {
  navy:   '#0C0D45',
  blue:   '#3E5BA3',
  teal:   '#75CBD1',
  bg:     '#EAF1FC',
  border: '#DAE8FB',
  white:  '#FFFFFF',
  purple: '#F2D2FF',
  pale:   '#DAE8FB',
} as const

const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="9" stroke={C.blue} strokeWidth="1.4" />
        <ellipse cx="11" cy="11" rx="4.5" ry="9" stroke={C.blue} strokeWidth="1.2" transform="rotate(30 11 11)" />
        <ellipse cx="11" cy="11" rx="4.5" ry="9" stroke={C.blue} strokeWidth="1.2" transform="rotate(-30 11 11)" />
        <circle cx="11" cy="11" r="2.2" fill={C.blue} />
      </svg>
    ),
    title: 'AI-Powered Analysis',
    text:  'AI analyzes your research topic, organizes key findings, and surfaces useful insights for further exploration.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="5" width="16" height="12" rx="3" stroke={C.teal} strokeWidth="1.4" />
        <path d="M7 9h8M7 13h5" stroke={C.teal} strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
    title: 'Research Map',
    text:  'Every finding lands on an interactive canvas. Drag nodes, follow relationship edges, and click any card for deep evidence.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M4 17l5-5 3 3 6-8" stroke={C.blue} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="4" cy="17" r="1.5" fill={C.blue} />
        <circle cx="9" cy="12" r="1.5" fill={C.blue} />
        <circle cx="12" cy="15" r="1.5" fill={C.blue} />
        <circle cx="18" cy="7"  r="1.5" fill={C.blue} />
      </svg>
    ),
    title: 'Comparison Insights',
    text:  'For comparison topics, a dedicated Insights page renders bar charts and side-by-side metrics to clarify trade-offs.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="8"  r="4" stroke={C.teal} strokeWidth="1.4" />
        <path d="M5 19c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke={C.teal} strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
    title: 'Ask ResearchNest',
    text:  'A contextual AI assistant lives alongside the map. Ask follow-up questions and get answers grounded in your own research.',
  },
]

export default function AboutSection() {
  const navigate = useNavigate()

  return (
    <section
      id="about"
      style={{
        backgroundColor: C.white,
        borderTop: `1px solid ${C.border}`,
        padding: '80px 24px',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: 56 }}
        >
          <span style={{
            display: 'inline-block',
            backgroundColor: C.bg,
            border: `1px solid ${C.border}`,
            borderRadius: 999,
            padding: '4px 16px',
            fontSize: '0.72rem',
            fontWeight: 600,
            color: C.blue,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: 18,
          }}>
            About ResearchNest
          </span>
          <h2 style={{
            fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
            fontWeight: 700,
            color: C.navy,
            lineHeight: 1.25,
            margin: '0 0 16px',
          }}>
            Research that thinks with you
          </h2>
          <p style={{ fontSize: '1rem', color: C.blue, lineHeight: 1.7, maxWidth: 580, margin: '0 auto' }}>
            ResearchNest transforms a research question into a structured, interactive knowledge map —
            powered by AI and designed for clarity at every scale.
          </p>
        </motion.div>

        {/* Feature grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 56 }}>
          {FEATURES.map(({ icon, title, text }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              style={{
                backgroundColor: C.bg,
                border: `1px solid ${C.border}`,
                borderRadius: 14,
                padding: '22px 20px',
              }}
            >
              <div style={{ marginBottom: 12 }}>{icon}</div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: C.navy, marginBottom: 6 }}>{title}</div>
              <div style={{ fontSize: '0.8rem', color: C.blue, lineHeight: 1.6 }}>{text}</div>
            </motion.div>
          ))}
        </div>

        {/* Mission paragraph */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.2 }}
          style={{
            backgroundColor: C.bg,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: '28px 32px',
            marginBottom: 40,
          }}
        >
          <p style={{ fontSize: '0.88rem', color: C.navy, lineHeight: 1.8, margin: 0 }}>
            <strong>Why ResearchNest?</strong> Traditional research workflows scatter findings across
            documents, tabs, and notes. ResearchNest consolidates the entire analysis into a single
            living map — relationships between ideas are visible, evidence is traceable, and the AI
            assistant is always one question away. Whether you're comparing two technologies, exploring
            a domain, or validating a hypothesis, ResearchNest keeps your thinking structured and your
            findings shareable.
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
          style={{ textAlign: 'center' }}
        >
          <motion.button
            whileHover={{ scale: 1.03, backgroundColor: '#1a1b6e' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/new')}
            style={{
              backgroundColor: C.navy,
              color: C.white,
              border: 'none',
              borderRadius: 14,
              padding: '14px 36px',
              fontSize: '0.92rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '0.01em',
              transition: 'background-color 0.2s',
            }}
          >
            Start a New Research
          </motion.button>
        </motion.div>

      </div>
    </section>
  )
}
