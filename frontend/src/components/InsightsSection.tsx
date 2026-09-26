import { motion } from 'motion/react'

const metrics = [
  { label: 'Flexibility', restVal: 35, graphqlVal: 68 },
  { label: 'Simplicity',  restVal: 62, graphqlVal: 42 },
  { label: 'Tooling',     restVal: 78, graphqlVal: 55 },
  { label: 'Efficiency',  restVal: 48, graphqlVal: 75 },
]

function Bar({ value, color, trackColor, delay }: { value: number; color: string; trackColor: string; delay: number }) {
  return (
    <div className="relative rounded-full overflow-hidden" style={{ backgroundColor: trackColor, height: 6 }}>
      <motion.div
        className="absolute left-0 top-0 h-full rounded-full"
        style={{ backgroundColor: color, width: 0 }}
        whileInView={{ width: `${value}%` }}
        viewport={{ once: true }}
        transition={{ duration: 0.65, delay, ease: 'easeOut' }}
      />
    </div>
  )
}

export default function InsightsSection() {
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
      <div className="max-w-2xl mx-auto px-6">
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
            margin: '0 0 48px',
          }}
        >
          From research to clear insights.
        </motion.h2>

        {/* Insights card */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl text-left mx-auto"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #DAE8FB',
            maxWidth: 520,
            boxShadow: '0 2px 20px rgba(62,91,163,0.09)',
            overflow: 'hidden',
          }}
        >
          {/* Card header */}
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ borderBottom: '1px solid #EAF1FC' }}
          >
            <span className="text-sm font-semibold" style={{ color: '#0C0D45' }}>
              REST API vs GraphQL
            </span>
            <div className="flex items-center gap-2">
              <span
                className="text-xs px-2.5 py-1 rounded-full"
                style={{
                  backgroundColor: '#EAF1FC',
                  color: '#3E5BA3',
                  border: '1px solid #DAE8FB',
                  fontSize: '0.7rem',
                }}
              >
                REST API
              </span>
              <span
                className="text-xs px-2.5 py-1 rounded-full"
                style={{
                  backgroundColor: '#0C0D45',
                  color: '#FFFFFF',
                  fontSize: '0.7rem',
                }}
              >
                GraphQL
              </span>
            </div>
          </div>

          {/* Metrics */}
          <div className="flex flex-col gap-4 px-5 py-4">
            {metrics.map((m, i) => (
              <div key={m.label}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-xs font-medium" style={{ color: '#3E5BA3' }}>
                    {m.label}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {/* REST track */}
                  <Bar value={m.restVal}    color="#3E5BA3"  trackColor="#EAF1FC" delay={0.2 + i * 0.06} />
                  {/* GraphQL track */}
                  <Bar value={m.graphqlVal} color="#75CBD1"  trackColor="#EAF1FC" delay={0.26 + i * 0.06} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
