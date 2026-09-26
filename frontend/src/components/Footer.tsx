import { Link } from 'react-router-dom'

const cols = [
  {
    header: null,
    links: ['Research', 'New Research', 'My Research'],
  },
  {
    header: null,
    links: ['Product', 'Research Map', 'Insights'],
  },
  {
    header: null,
    links: ['About', 'How it works', 'About ResearchFlow'],
  },
]

export default function Footer() {
  return (
    <footer
      className="w-full"
      style={{
        backgroundColor: '#0C0D45',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div className="px-8 pt-12 pb-8">
        {/* Brand block */}
        <div className="mb-10">
          <p
            className="font-bold mb-1"
            style={{
              color: '#FFFFFF',
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '1.35rem',
              lineHeight: 1.2,
            }}
          >
            ResearchFlow
          </p>
          <p
            style={{
              color: 'rgba(255,255,255,0.55)',
              fontSize: '1.05rem',
              fontFamily: 'Inter, system-ui, sans-serif',
              lineHeight: 1.3,
            }}
          >
            Research without the chaos.
          </p>
        </div>

        {/* Link columns */}
        <div className="flex gap-16 mb-12">
          {cols.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-2.5">
              {col.links.map((label, li) => (
                <Link
                  key={label}
                  to="#"
                  className="transition-colors duration-200"
                  style={{
                    color: li === 0 ? '#FFFFFF' : 'rgba(255,255,255,0.6)',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: li === 0 ? 600 : 400,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#FFFFFF' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = li === 0 ? '#FFFFFF' : 'rgba(255,255,255,0.6)' }}
                >
                  {label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="pt-6"
          style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
        >
          <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
            © 2026 ResearchFlow
          </p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Built for developers, powered by AI
          </p>
        </div>
      </div>
    </footer>
  )
}
