import { motion } from 'motion/react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useResearch } from '../context/ResearchContext'

const C = {
  navy:   '#0C0D45',
  blue:   '#3E5BA3',
  teal:   '#75CBD1',
  bg:     '#EAF1FC',
  border: '#DAE8FB',
  purple: '#F2D2FF',
  white:  '#FFFFFF',
} as const

// Per-link accent colors
const linkColors: Record<string, { bg: string; text: string; border: string }> = {
  '/new':      { bg: C.navy,   text: C.white, border: C.navy   },
  '/analysis': { bg: C.purple, text: C.navy,  border: C.purple },
  '/insights': { bg: C.teal,   text: C.navy,  border: C.teal   },
  '/':         { bg: C.border, text: C.navy,  border: C.teal   },
  about:       { bg: C.border, text: C.navy,  border: C.border },
}

export default function Navbar() {
  const { pathname } = useLocation()
  const navigate     = useNavigate()
  const { research } = useResearch()

  const hasResearch = research.title !== 'TOPIC NAME'

  // Scroll to #about section on landing page
  function handleAbout(e: React.MouseEvent) {
    e.preventDefault()
    if (pathname !== '/') {
      navigate('/')
      // After navigation, the DOM is not ready yet — use a small timeout
      setTimeout(() => {
        document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } else {
      document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Build link list based on research state
  const navLinks: Array<{ label: string; to: string | null; onClick?: (e: React.MouseEvent) => void }> = [
    { label: 'About',        to: null, onClick: handleAbout },
    { label: 'New Research', to: '/new' },
    ...(hasResearch ? [{ label: 'Analysis', to: '/analysis' }] : []),
    ...(hasResearch && research.researchType === 'comparison' ? [{ label: 'Insights', to: '/insights' }] : []),
  ]

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
      className="w-full flex justify-center px-6 pt-5 pb-3"
    >
      <div
        className="flex items-center gap-1 rounded-full px-2 py-1.5 shadow-sm"
        style={{ backgroundColor: C.white, border: `1px solid ${C.border}` }}
      >
        {/* Logo mark */}
        <Link to="/">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center mr-2"
            style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, cursor: 'pointer' }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke={C.blue} strokeWidth="1.2" />
              <ellipse cx="10" cy="10" rx="4" ry="8" stroke={C.blue} strokeWidth="1.2" transform="rotate(30 10 10)" />
              <ellipse cx="10" cy="10" rx="4" ry="8" stroke={C.blue} strokeWidth="1.2" transform="rotate(-30 10 10)" />
              <circle cx="10" cy="10" r="2" fill={C.blue} />
            </svg>
          </div>
        </Link>

        {navLinks.map(({ label, to, onClick }) => {
          const colorKey = to ?? 'about'
          const isActive = to ? pathname === to : false
          const colors   = linkColors[colorKey] ?? linkColors['/new']

          const inner = (
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="px-5 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-colors duration-200"
              style={{
                fontFamily:      'Inter, system-ui, sans-serif',
                backgroundColor: isActive ? colors.bg    : 'transparent',
                color:           isActive ? colors.text  : C.blue,
                border:          isActive ? `1px solid ${colors.border}` : '1px solid transparent',
              }}
            >
              {label}
            </motion.div>
          )

          if (onClick) {
            return (
              <a key={label} href="#about" onClick={onClick} style={{ textDecoration: 'none' }}>
                {inner}
              </a>
            )
          }

          return (
            <Link key={to!} to={to!} style={{ textDecoration: 'none' }}>
              {inner}
            </Link>
          )
        })}
      </div>
    </motion.nav>
  )
}
