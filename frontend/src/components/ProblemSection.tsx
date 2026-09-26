import { motion } from 'motion/react'

interface DocCardProps {
  style: React.CSSProperties
  lines: number[]   // width percentages
  highlight?: boolean
  delay?: number
  label?: string
  labelStyle?: 'caveat' | 'inter'
}

function DocCard({ style, lines, highlight, delay, label, labelStyle = 'caveat' }: DocCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.45, delay: delay ?? 0 }}
      className="absolute rounded-xl p-3 shadow-sm"
      style={{
        backgroundColor: highlight ? '#F2D2FF' : '#FFFFFF',
        border: `1px solid ${highlight ? 'rgba(242,210,255,0.8)' : '#DAE8FB'}`,
        fontFamily: 'Inter, system-ui, sans-serif',
        boxShadow: '0 2px 8px rgba(62,91,163,0.08)',
        ...style,
      }}
    >
      {label && (
        <p
          className="mb-2"
          style={{
            fontFamily: labelStyle === 'caveat' ? 'Caveat, cursive' : 'Inter, sans-serif',
            color: highlight ? '#6B3FA0' : '#3E5BA3',
            fontSize: labelStyle === 'caveat' ? '0.8rem' : '0.65rem',
            fontWeight: labelStyle === 'caveat' ? 500 : 600,
            lineHeight: 1.3,
          }}
        >
          {label}
        </p>
      )}
      <div className="flex flex-col gap-1.5">
        {lines.map((w, i) => (
          <div
            key={i}
            className="rounded-full"
            style={{
              height: 5,
              backgroundColor: highlight ? 'rgba(107,63,160,0.18)' : '#DAE8FB',
              width: `${w}%`,
            }}
          />
        ))}
      </div>
    </motion.div>
  )
}

export default function ProblemSection() {
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
      <div className="max-w-4xl mx-auto px-6">
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
          Research shouldn't mean opening 20 tabs.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.08 }}
          style={{ color: '#3E5BA3', fontSize: '0.875rem', margin: 0 }}
        >
          Technical research gets scattered across docs, articles, GitHub threads,
          <br /> blogs, and half-finished notes.
        </motion.p>

        {/* Illustration — matches Figma proportions */}
        {/* Note: height is generous so bottom cards and badge are never clipped */}
        <div
          className="relative mx-auto mt-14"
          style={{ height: 320, maxWidth: 640 }}
        >
          {/* Left cluster — plain white cards */}
          <DocCard
            style={{ top: 8, left: 0, width: 160 }}
            lines={[90, 75, 80, 60]}
            delay={0.12}
          />
          <DocCard
            style={{ top: 100, left: 30, width: 148 }}
            lines={[85, 70, 60]}
            delay={0.18}
            label="WAR, article about caching strategies..."
          />

          {/* Center — highlighted purple card */}
          <DocCard
            style={{ top: 55, left: 145, width: 155 }}
            lines={[88, 70, 55]}
            highlight
            delay={0.22}
            label="valid cache = new Map()..."
          />

          {/* Center-right plain card */}
          <DocCard
            style={{ top: 12, left: 270, width: 148 }}
            lines={[90, 80, 70, 60, 50]}
            delay={0.28}
          />

          {/* Bottom center */}
          <DocCard
            style={{ top: 155, left: 195, width: 148 }}
            lines={[85, 70, 60, 75]}
            delay={0.32}
            label="valid cache + new Map() — Tests"
            labelStyle="inter"
          />

          {/* ResearchFlow badge — far right matching Figma */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.42 }}
            className="absolute flex items-center gap-2 px-4 py-2.5 rounded-2xl"
            style={{
              right: 0,
              bottom: 24,
              backgroundColor: '#0C0D45',
              color: '#FFFFFF',
              fontFamily: 'Inter, system-ui, sans-serif',
              boxShadow: '0 4px 16px rgba(12,13,69,0.2)',
            }}
          >
            {/* Logo orbital */}
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#3E5BA3' }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="4.5" stroke="#EAF1FC" strokeWidth="1" />
                <ellipse cx="6" cy="6" rx="2" ry="4.5" stroke="#EAF1FC" strokeWidth="1" />
                <circle cx="6" cy="6" r="1.5" fill="#EAF1FC" />
              </svg>
            </div>
            <span className="text-xs font-semibold tracking-wide">ResearchFlow</span>
          </motion.div>

          {/* Connector lines — subtle dashes */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ opacity: 0.18 }}
          >
            <line x1="160" y1="60" x2="270" y2="70" stroke="#3E5BA3" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="190" y1="130" x2="345" y2="55" stroke="#3E5BA3" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="90" y1="110" x2="200" y2="175" stroke="#3E5BA3" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="300" y1="90" x2="530" y2="240" stroke="#3E5BA3" strokeWidth="1" strokeDasharray="3 3" />
          </svg>
        </div>
      </div>
    </section>
  )
}
