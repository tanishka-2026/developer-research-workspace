import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'

export default function Hero() {
  const navigate = useNavigate()

  return (
    <section
      className="flex flex-col items-center justify-center text-center px-6"
      style={{
        backgroundColor: '#EAF1FC',
        fontFamily: 'Inter, system-ui, sans-serif',
        paddingTop: '56px',
        paddingBottom: '64px',
      }}
    >
      {/* Handwritten greeting — Caveat, italic feel from Figma */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1 }}
        style={{
          fontFamily: 'Caveat, cursive',
          color: '#0C0D45',
          fontSize: '2.25rem',
          fontWeight: 500,
          marginBottom: '6px',
          lineHeight: 1.15,
        }}
      >
        Hey Developer!
      </motion.p>

      {/* Main headline */}
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.18 }}
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          color: '#0C0D45',
          fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)',
          fontWeight: 600,
          margin: '0 0 36px',
          lineHeight: 1.25,
        }}
      >
        What are you researching today?
      </motion.h1>

      {/* CTA row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.26 }}
        className="flex items-center gap-3"
      >
        {/* Shuffle icon button — matches Figma circle with arrows */}
        <button
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #DAE8FB',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#EAF1FC'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#FFFFFF'
          }}
          title="Suggest a topic"
        >
          {/* Arrow / shuffle icon matching Figma */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 2l2 2-2 2" stroke="#3E5BA3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 4h9" stroke="#3E5BA3" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M6 10l-2 2 2 2" stroke="#3E5BA3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M13 12H4" stroke="#3E5BA3" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>

        {/* New Research CTA */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/new')}
          className="flex items-center gap-2 px-7 py-2.5 rounded-full text-sm font-semibold"
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            backgroundColor: '#0C0D45',
            color: '#FFFFFF',
            border: 'none',
            cursor: 'pointer',
            letterSpacing: '0.01em',
          }}
        >
          New Research
        </motion.button>
      </motion.div>
    </section>
  )
}
