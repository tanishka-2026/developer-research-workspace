import { motion } from 'motion/react'

const books = [
  {
    id: 1,
    title: 'DBMS Architecture',
    resources: ['Resource link 1', 'Resource link 2', 'Resource link 3', 'Resource link 4'],
    tags: ['DBMS', 'Architecture'],
    iconColor: '#3E5BA3',
    iconBg: '#EAF1FC',
  },
  {
    id: 2,
    title: 'REST API vs GraphQL for modern applications',
    resources: ['Resource link 1', 'Resource link 2', 'Resource link 3', 'Resource link 4'],
    tags: ['REST', 'GraphQL'],
    iconColor: '#3E5BA3',
    iconBg: '#DAE8FB',
  },
  {
    id: 3,
    title: 'How does OAuth 2.0 authentication work?',
    resources: ['Resource link 1', 'Resource link 2', 'Resource link 3', 'Resource link 4'],
    tags: ['OAuth', 'Auth'],
    iconColor: '#3E5BA3',
    iconBg: '#F2D2FF',
  },
  {
    id: 4,
    title: 'How does a browser render a webpage?',
    resources: ['Resource link 1', 'Resource link 2', 'Resource link 3', 'Resource link 4'],
    tags: ['Browser', 'HTML'],
    iconColor: '#3E5BA3',
    iconBg: '#DAE8FB',
  },
  {
    id: 5,
    title: 'DBMS Architecture',
    resources: ['Resource link 1', 'Resource link 2', 'Resource link 3', 'Resource link 4'],
    tags: ['DBMS', 'SQL'],
    iconColor: '#3E5BA3',
    iconBg: '#EAF1FC',
  },
  {
    id: 6,
    title: 'REST API vs GraphQL for modern applications',
    resources: ['Resource link 1', 'Resource link 2', 'Resource link 3', 'Resource link 4'],
    tags: ['REST', 'API'],
    iconColor: '#3E5BA3',
    iconBg: '#DAE8FB',
  },
]

function ResearchCard({
  book,
  index,
}: {
  book: (typeof books)[0]
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      whileHover={{ y: -2, boxShadow: '0 4px 16px rgba(62,91,163,0.12)', transition: { duration: 0.18 } }}
      className="flex flex-col gap-2.5 p-3.5 rounded-xl flex-shrink-0"
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #DAE8FB',
        fontFamily: 'Inter, system-ui, sans-serif',
        width: 188,
        boxShadow: '0 1px 3px rgba(62,91,163,0.06)',
      }}
    >
      {/* Header: icon + title */}
      <div className="flex items-start gap-2">
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ backgroundColor: book.iconBg }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="1" y="2" width="10" height="8" rx="1.5" stroke={book.iconColor} strokeWidth="1.2" />
            <path d="M3 5h6M3 7h4" stroke={book.iconColor} strokeWidth="1" strokeLinecap="round" />
          </svg>
        </div>
        <span
          className="text-xs font-semibold leading-snug"
          style={{ color: '#0C0D45', lineHeight: 1.35 }}
        >
          {book.title}
        </span>
      </div>

      {/* Resource links */}
      <div className="flex flex-col gap-1">
        {book.resources.map((r, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div
              className="rounded-sm flex-shrink-0"
              style={{ width: 10, height: 10, backgroundColor: '#EAF1FC', border: '1px solid #DAE8FB' }}
            />
            <span className="text-xs" style={{ color: '#3E5BA3', fontSize: '0.7rem' }}>
              {r}
            </span>
          </div>
        ))}
      </div>

      {/* Tags */}
      <div className="flex gap-1 flex-wrap">
        {book.tags.map((tag) => (
          <span
            key={tag}
            className="text-xs px-1.5 py-0.5 rounded-full"
            style={{
              backgroundColor: '#EAF1FC',
              color: '#3E5BA3',
              border: '1px solid #DAE8FB',
              fontSize: '0.65rem',
            }}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Open button */}
      <button
        className="w-full text-xs font-medium py-1.5 rounded-lg transition-all duration-200"
        style={{
          backgroundColor: '#DAE8FB',
          color: '#3E5BA3',
          border: 'none',
          cursor: 'pointer',
          marginTop: 'auto',
          fontSize: '0.7rem',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#3E5BA3'
          e.currentTarget.style.color = '#FFFFFF'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#DAE8FB'
          e.currentTarget.style.color = '#3E5BA3'
        }}
      >
        Open Research Book
      </button>
    </motion.div>
  )
}

export default function MyLibrary() {
  return (
    <section
      className="w-full py-5"
      style={{
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid #EAF1FC',
        borderBottom: '1px solid #EAF1FC',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Section header — full bleed, left-padded */}
      <div className="flex items-center justify-between px-8 mb-4">
        <h2
          className="text-base font-semibold"
          style={{ color: '#0C0D45', fontFamily: 'Inter, system-ui, sans-serif' }}
        >
          My Library
        </h2>
        {/* Diamond nav buttons matching Figma */}
        <div className="flex gap-2">
          {['◆', '◆'].map((d, i) => (
            <button
              key={i}
              className="text-sm transition-colors duration-200"
              style={{
                background: 'none',
                border: 'none',
                color: '#3E5BA3',
                cursor: 'pointer',
                padding: '2px 4px',
                opacity: 0.7,
              }}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Horizontally scrollable card row */}
      <div
        className="flex gap-3 overflow-x-auto px-8 pb-2"
        style={{ scrollbarWidth: 'none' }}
      >
        {books.map((book, i) => (
          <ResearchCard key={book.id} book={book} index={i} />
        ))}
      </div>
    </section>
  )
}
