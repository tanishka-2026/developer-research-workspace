import { motion } from 'motion/react'
import { Link, useLocation } from 'react-router-dom'

const navLinks = [
  { label: 'New Research', to: '/new' },
  { label: 'Analysis', to: '/analysis' },
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
]

// Per-link accent colors that match the Figma
const linkColors: Record<string, { bg: string; text: string; border: string }> = {
  '/new':      { bg: '#0C0D45', text: '#FFFFFF', border: '#0C0D45' },
  '/analysis': { bg: '#F2D2FF', text: '#0C0D45', border: '#F2D2FF' },
  '/':         { bg: '#DAE8FB', text: '#0C0D45', border: '#75CBD1' },
  '/about':    { bg: '#DAE8FB', text: '#0C0D45', border: '#DAE8FB' },
}

export default function Navbar() {
  const { pathname } = useLocation()

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
        style={{ backgroundColor: '#FFFFFF', border: '1px solid #DAE8FB' }}
      >
        {/* Logo mark */}
        <Link to="/">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center mr-2"
            style={{ backgroundColor: '#EAF1FC', border: '1px solid #DAE8FB', cursor: 'pointer' }}
          >
            {/* Figma logo: orbital rings + sparkle */}
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke="#3E5BA3" strokeWidth="1.2" />
              <ellipse cx="10" cy="10" rx="4" ry="8" stroke="#3E5BA3" strokeWidth="1.2" transform="rotate(30 10 10)" />
              <ellipse cx="10" cy="10" rx="4" ry="8" stroke="#3E5BA3" strokeWidth="1.2" transform="rotate(-30 10 10)" />
              <circle cx="10" cy="10" r="2" fill="#3E5BA3" />
            </svg>
          </div>
        </Link>

        {navLinks.map(({ label, to }) => {
          const isActive = pathname === to
          const colors = linkColors[to]
          return (
            <Link key={to} to={to} style={{ textDecoration: 'none' }}>
              <motion.div
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="px-5 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-colors duration-200"
                style={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  backgroundColor: isActive ? colors.bg : 'transparent',
                  color: isActive ? colors.text : '#3E5BA3',
                  border: isActive ? `1px solid ${colors.border}` : '1px solid transparent',
                }}
              >
                {label}
              </motion.div>
            </Link>
          )
        })}
      </div>
    </motion.nav>
  )
}
