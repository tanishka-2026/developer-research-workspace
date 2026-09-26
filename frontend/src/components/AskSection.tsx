import { motion } from 'motion/react'

export default function AskSection() {
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
          Still have a question? Ask your research.
        </motion.h2>

        {/* Ask widget */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl p-4 text-left mx-auto"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #DAE8FB',
            maxWidth: 400,
            boxShadow: '0 2px 20px rgba(62,91,163,0.09)',
          }}
        >
          {/* Widget header */}
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#EAF1FC', border: '1px solid #DAE8FB' }}
            >
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                <circle cx="4.5" cy="4.5" r="3.5" stroke="#3E5BA3" strokeWidth="1" />
                <ellipse cx="4.5" cy="4.5" rx="1.5" ry="3.5" stroke="#3E5BA3" strokeWidth="0.8" />
              </svg>
            </div>
            <span className="text-xs font-semibold" style={{ color: '#0C0D45' }}>
              Ask ResearchNest
            </span>
          </div>

          {/* Topic chip */}
          <div
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg mb-3 text-xs"
            style={{ backgroundColor: '#EAF1FC', border: '1px solid #DAE8FB', color: '#3E5BA3' }}
          >
            <span style={{ fontSize: '0.7rem' }}>Topic: Research has not understood API</span>
          </div>

          {/* AI response body */}
          <div
            className="rounded-xl p-3 mb-3 text-xs leading-relaxed"
            style={{
              backgroundColor: '#F7FAFE',
              border: '1px solid #EAF1FC',
              color: '#3E5BA3',
            }}
          >
            An API (Application Programming Interface) is a set of rules and protocols that
            allows different software applications to communicate and exchange data with each
            other. Essentially, it acts as a bridge between different systems, enabling them
            to talk to each other, automating function, and bringing them to perform…
          </div>

          {/* Follow-up link */}
          <div className="mb-3">
            <button
              className="text-xs font-medium"
              style={{ color: '#3E5BA3', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
            >
              How is it used in large systems?
            </button>
          </div>

          {/* Pending indicator */}
          <div className="flex items-center gap-1.5 mb-3">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#75CBD1' }} />
            <span className="text-xs" style={{ color: '#75CBD1' }}>Pending...</span>
          </div>

          {/* Input row */}
          <div className="flex items-center gap-2">
            <div
              className="flex-1 flex items-center gap-2 rounded-full px-3 py-1.5"
              style={{ backgroundColor: '#EAF1FC', border: '1px solid #DAE8FB' }}
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <circle cx="4.5" cy="4.5" r="3.5" stroke="#3E5BA3" strokeWidth="1.1" />
                <path d="M7.5 7.5l2 2" stroke="#3E5BA3" strokeWidth="1.1" strokeLinecap="round" />
              </svg>
              <span className="text-xs" style={{ color: '#75CBD1' }}>Ask ResearchNest</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#0C0D45', border: 'none', cursor: 'pointer' }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5h6M5.5 2l3 3-3 3" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
