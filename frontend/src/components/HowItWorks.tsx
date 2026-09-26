import { motion } from 'motion/react'

const steps = [
  {
    id: 1,
    title: 'Your Question',
    body: 'Paste anything\nyou want to research\nor understand.',
    bg: '#FFFFFF',
    border: '#DAE8FB',
    titleColor: '#0C0D45',
  },
  {
    id: 2,
    title: 'Sources',
    body: 'URLs, docs, paste text —\nanything goes.',
    bg: '#FFFFFF',
    border: '#DAE8FB',
    titleColor: '#0C0D45',
  },
  {
    id: 3,
    title: 'AI Analysis',
    body: 'ResearchNest ties your\nsources together and\ndraws meaning from them.',
    bg: '#FFFFFF',
    border: '#DAE8FB',
    titleColor: '#0C0D45',
  },
  {
    id: 4,
    title: 'Research Map',
    body: 'Findings connected to evidence, ideas to sources.',
    bg: '#0C0D45',
    border: '#0C0D45',
    titleColor: '#FFFFFF',
    dark: true,
  },
]

function Arrow() {
  return (
    <div className="flex items-center justify-center px-1">
      <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
        <path
          d="M1 8h16M13 3l5 5-5 5"
          stroke="#3E5BA3"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

export default function HowItWorks() {
  return (
    <section
      className="w-full px-6 py-20 text-center"
      style={{
        backgroundColor: '#DAE8FB',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div className="max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-2xl sm:text-3xl font-bold mb-3"
          style={{ color: '#0C0D45' }}
        >
          Turn scattered research into something you can see.
        </motion.h2>

        {/* Steps row */}
        <div className="flex items-center justify-center gap-0 mt-12 flex-wrap">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-center">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="rounded-2xl p-4 text-left"
                style={{
                  backgroundColor: step.bg,
                  border: `1px solid ${step.border}`,
                  width: 160,
                  minHeight: 130,
                  boxShadow: step.dark
                    ? '0 4px 16px rgba(12,13,69,0.25)'
                    : '0 1px 4px rgba(62,91,163,0.08)',
                }}
              >
                {/* Map dots for the dark card */}
                {step.dark && (
                  <div className="flex gap-1 mb-2">
                    {[0, 1, 2, 3, 4, 5].map((d) => (
                      <div
                        key={d}
                        className="rounded-full"
                        style={{
                          width: 5,
                          height: 5,
                          backgroundColor:
                            d === 0 ? '#75CBD1' : d === 3 ? '#F2D2FF' : 'rgba(255,255,255,0.25)',
                        }}
                      />
                    ))}
                  </div>
                )}
                <p
                  className="text-xs font-bold mb-2"
                  style={{ color: step.titleColor }}
                >
                  {step.title}
                </p>
                <p
                  className="text-xs whitespace-pre-line leading-relaxed"
                  style={{ color: step.dark ? 'rgba(255,255,255,0.65)' : '#3E5BA3' }}
                >
                  {step.body}
                </p>
              </motion.div>
              {i < steps.length - 1 && <Arrow />}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
