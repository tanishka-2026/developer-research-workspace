import { useState, useRef, useCallback } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { useResearch, buildResearch } from '../context/ResearchContext'
import { analyzeResearch } from '../api/analyzeApi'

const GOALS = ['Explore', 'Compare', 'Validate', 'Analyze', 'Investigate', 'Other']

const DOMAINS = [
  'Technology',
  'Science',
  'Business',
  'Healthcare',
  'Education',
  'Finance',
  'Law',
  'Other',
]

// ── small reusable step badge ──────────────────────────────────────────────
function StepBadge({ n }: { n: number }) {
  return (
    <span
      className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold flex-shrink-0"
      style={{ backgroundColor: '#0C0D45', color: '#FFFFFF', fontFamily: 'Inter, sans-serif' }}
    >
      {n}
    </span>
  )
}

// ── resource row ───────────────────────────────────────────────────────────
function ResourceRow({
  label,
  checked,
  onToggle,
}: {
  label: string
  checked: boolean
  onToggle: () => void
}) {
  return (
    <div
      className="flex items-center justify-between px-4 py-2.5 rounded-xl cursor-pointer transition-colors duration-150"
      style={{
        backgroundColor: checked ? '#EAF1FC' : '#F0F4FA',
        border: `1px solid ${checked ? '#DAE8FB' : 'transparent'}`,
      }}
      onClick={onToggle}
    >
      <span className="text-sm" style={{ color: '#3E5BA3', fontFamily: 'Inter, sans-serif' }}>
        {label}
      </span>
      {checked && (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 7l3.5 3.5L12 3" stroke="#3E5BA3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  )
}

// ── main component ─────────────────────────────────────────────────────────
// ── file upload helpers ────────────────────────────────────────────────────
interface UploadedFile { name: string; size: number; mimeType: string }
const SUPPORTED_EXTS = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt']
function fileExt(name: string) { return name.split('.').pop()?.toLowerCase() ?? '' }
function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileItemRow({ file, onRemove }: { file: UploadedFile; onRemove: () => void }) {
  const ext = fileExt(file.name)
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '7px 12px', borderRadius: 10, backgroundColor: '#EAF1FC', border: '1px solid #DAE8FB', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0, flex: 1 }}>
        <span style={{ fontSize: '0.58rem', fontWeight: 700, color: '#3E5BA3', textTransform: 'uppercase',
          backgroundColor: '#DAE8FB', borderRadius: 4, padding: '1px 5px', flexShrink: 0 }}>{ext}</span>
        <span style={{ fontSize: '0.72rem', color: '#0C0D45', fontFamily: 'Inter, sans-serif',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
        <span style={{ fontSize: '0.65rem', color: '#9090B0', flexShrink: 0 }}>{fmtSize(file.size)}</span>
      </div>
      <button onClick={onRemove} title="Remove"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9090B0', padding: '0 2px', flexShrink: 0, lineHeight: 1 }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  )
}

// ── main component ─────────────────────────────────────────────────────────
export default function CreateResearch() {
  const navigate = useNavigate()
  const { setResearch } = useResearch()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const [domain, setDomain] = useState('')
  const [domainOpen, setDomainOpen] = useState(false)
  const [resourceLinks, setResourceLinks] = useState(['Resource link 1', 'Resource link 2'])
  const [checkedResources, setCheckedResources] = useState<boolean[]>([true, true])
  const [aiSearch, setAiSearch] = useState(true)
  const [context, setContext] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const addFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return
    const errors: string[] = []
    const toAdd: UploadedFile[] = []
    Array.from(fileList).forEach(f => {
      const ext = fileExt(f.name)
      if (!SUPPORTED_EXTS.includes(ext)) {
        errors.push(`"${f.name}" is not supported (use PDF, DOC, DOCX, PPT, PPTX or TXT)`)
        return
      }
      // Prevent duplicates by name+size
      const isDup = uploadedFiles.some(u => u.name === f.name && u.size === f.size)
      if (isDup) return
      toAdd.push({ name: f.name, size: f.size, mimeType: f.type })
    })
    if (errors.length) setUploadError(errors[0])
    else setUploadError(null)
    if (toAdd.length) setUploadedFiles(prev => [...prev, ...toAdd])
  }, [uploadedFiles])

  function toggleGoal(g: string) {
    setSelectedGoals((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    )
  }

  function toggleResource(i: number) {
    setCheckedResources((prev) => prev.map((v, idx) => (idx === i ? !v : v)))
  }

  async function handleAnalyze() {
    setIsLoading(true)
    setAnalysisError(null)
    const resolvedTitle  = title.trim()   || 'TOPIC NAME'
    const resolvedDomain = domain         || 'Technology'
    const resolvedGoal   = selectedGoals.join(', ') || 'Explore'

    try {
      const result = await analyzeResearch({
        title:    resolvedTitle,
        question: description.trim(),
        goal:     resolvedGoal,
        domain:   resolvedDomain,
        context:  context.trim(),
      })

      // Merge API response into shared Research state.
      // buildResearch fills any missing fields with mock defaults.
      setResearch(
        buildResearch({
          title:         resolvedTitle,
          question:      description.trim(),
          goal:          resolvedGoal,
          domain:        resolvedDomain,
          context:       context.trim(),
          summary:       result.summary,
          researchType:  result.researchType,
          sources:       result.sources,
          evidence:      result.evidence,
          findings:      result.findings,
          relationships: result.relationships,
          insights:      result.insights,
        })
      )
      navigate('/analysis')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Research analysis failed. Please try again.'
      console.error('[CreateResearch] /api/analyze failed:', err)
      setAnalysisError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full min-h-screen px-6 py-6"
      style={{ backgroundColor: '#EAF1FC', fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      <div className="max-w-5xl mx-auto">

        {/* ── Top two-column row ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">

          {/* LEFT card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="rounded-2xl p-5 flex flex-col gap-5"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #DAE8FB',
              boxShadow: '0 1px 8px rgba(62,91,163,0.06)',
            }}
          >
            {/* Title input */}
            <input
              type="text"
              placeholder="Enter your research title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors duration-150"
              style={{
                backgroundColor: '#DAE8FB',
                border: '1.5px solid transparent',
                color: '#0C0D45',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3E5BA3'
                e.currentTarget.style.backgroundColor = '#EAF1FC'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'transparent'
                e.currentTarget.style.backgroundColor = '#DAE8FB'
              }}
            />

            {/* Divider */}
            <div style={{ borderTop: '1px solid #EAF1FC' }} />

            {/* Step 1 — understanding */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <StepBadge n={1} />
                <span className="text-sm font-semibold" style={{ color: '#0C0D45' }}>
                  What  are you trying to understand?
                </span>
              </div>
              <textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none transition-colors duration-150"
                style={{
                  backgroundColor: '#DAE8FB',
                  border: '1.5px solid transparent',
                  color: '#0C0D45',
                  fontFamily: 'Inter, sans-serif',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#3E5BA3'
                  e.currentTarget.style.backgroundColor = '#EAF1FC'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'transparent'
                  e.currentTarget.style.backgroundColor = '#DAE8FB'
                }}
              />
            </div>

            {/* Step 2 — goal chips */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <StepBadge n={2} />
                <span className="text-sm font-semibold" style={{ color: '#0C0D45' }}>
                  What do you want to do with this research?
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {GOALS.map((g) => {
                  const active = selectedGoals.includes(g)
                  return (
                    <motion.button
                      key={g}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleGoal(g)}
                      className="px-3 py-1 rounded-full text-sm transition-all duration-150 cursor-pointer"
                      style={{
                        backgroundColor: active ? '#0C0D45' : 'transparent',
                        color: active ? '#FFFFFF' : '#0C0D45',
                        border: '1px solid #0C0D45',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      {g}
                    </motion.button>
                  )
                })}
              </div>
            </div>

            {/* Step 3 — domain */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <StepBadge n={3} />
                <span className="text-sm font-semibold" style={{ color: '#0C0D45' }}>
                  Domain
                </span>
              </div>
              <div className="relative">
                <button
                  onClick={() => setDomainOpen((o) => !o)}
                  className="w-full flex items-center gap-2 rounded-xl px-4 py-3 text-sm text-left transition-colors duration-150"
                  style={{
                    backgroundColor: '#DAE8FB',
                    border: domainOpen ? '1.5px solid #3E5BA3' : '1.5px solid transparent',
                    color: domain ? '#0C0D45' : '#3E5BA3',
                    fontFamily: 'Inter, sans-serif',
                    cursor: 'pointer',
                  }}
                >
                  {/* chevron */}
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    style={{ transform: domainOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                  >
                    <path d="M3 5l4 4 4-4" stroke="#3E5BA3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>{domain || 'Select Domain'}</span>
                </button>
                {domainOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 right-0 top-full mt-1 rounded-xl overflow-hidden z-20"
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #DAE8FB',
                      boxShadow: '0 4px 16px rgba(62,91,163,0.12)',
                    }}
                  >
                    {DOMAINS.map((d) => (
                      <button
                        key={d}
                        onClick={() => { setDomain(d); setDomainOpen(false) }}
                        className="w-full text-left px-4 py-2.5 text-sm transition-colors duration-100"
                        style={{
                          backgroundColor: domain === d ? '#EAF1FC' : 'transparent',
                          color: '#0C0D45',
                          border: 'none',
                          cursor: 'pointer',
                          fontFamily: 'Inter, sans-serif',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#EAF1FC' }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = domain === d ? '#EAF1FC' : 'transparent' }}
                      >
                        {d}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>

          {/* RIGHT card — sources */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="rounded-2xl flex flex-col gap-4"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #DAE8FB',
              boxShadow: '0 1px 8px rgba(62,91,163,0.06)',
              overflow: 'hidden',
            }}
          >
            {/* Dropzone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files) }}
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 py-8 px-6 cursor-pointer transition-colors duration-150"
              style={{
                backgroundColor: dragOver ? '#DAE8FB' : '#F0F4FA',
                borderBottom: '1px solid #DAE8FB',
                minHeight: 160,
                border: dragOver ? '2px dashed #3E5BA3' : '2px dashed transparent',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                style={{ display: 'none' }}
                onChange={e => addFiles(e.target.files)}
              />
              <svg width="38" height="38" viewBox="0 0 40 40" fill="none">
                <path d="M20 26V14M20 14l-5 5M20 14l5 5" stroke={dragOver ? '#0C0D45' : '#3E5BA3'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 28a6 6 0 01-1-11.92A8 8 0 0128 18a6 6 0 010 10" stroke={dragOver ? '#0C0D45' : '#3E5BA3'} strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <p className="text-sm text-center" style={{ color: dragOver ? '#0C0D45' : '#3E5BA3', fontWeight: 400, margin: 0, pointerEvents: 'none' }}>
                {dragOver ? 'Drop files here' : (<>Drag files here or <strong>Browse Files</strong></>)}
              </p>
              <p style={{ fontSize: '0.65rem', color: '#9090B0', margin: 0, pointerEvents: 'none' }}>PDF · DOC · DOCX · PPT · PPTX · TXT</p>
            </div>

            {/* Error message */}
            {uploadError && (
              <div style={{ margin: '6px 16px 0', padding: '7px 12px', backgroundColor: '#FFF0F0', border: '1px solid #F0CCEA', borderRadius: 8,
                fontSize: '0.72rem', color: '#A03060', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span>{uploadError}</span>
                <button onClick={() => setUploadError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A03060', flexShrink: 0, lineHeight: 1 }}>×</button>
              </div>
            )}

            {/* Uploaded file list */}
            {uploadedFiles.length > 0 && (
              <div style={{ padding: '8px 16px 0', display: 'flex', flexDirection: 'column', gap: 5 }}>
                {uploadedFiles.map((f, i) => (
                  <FileItemRow key={`${f.name}-${i}`} file={f} onRemove={() => setUploadedFiles(prev => prev.filter((_, idx) => idx !== i))} />
                ))}
              </div>
            )}

            {/* Resource rows */}
            <div className="flex flex-col gap-3 px-5 pb-3">
              {resourceLinks.map((label, i) => (
                <ResourceRow
                  key={i}
                  label={label}
                  checked={checkedResources[i] ?? false}
                  onToggle={() => toggleResource(i)}
                />
              ))}

              {/* Add URL input — clicking appends */}
              <ResourceAdd
                onAdd={(url) => {
                  setResourceLinks((prev) => [...prev, url])
                  setCheckedResources((prev) => [...prev, true])
                }}
              />
            </div>

            {/* Let AI search row */}
            <div
              className="mx-5 mb-5 flex items-center justify-between px-4 py-2.5 rounded-xl cursor-pointer transition-colors duration-150"
              style={{
                backgroundColor: aiSearch ? '#EAF1FC' : '#F0F4FA',
                border: `1px solid ${aiSearch ? '#DAE8FB' : 'transparent'}`,
              }}
              onClick={() => setAiSearch((v) => !v)}
            >
              <span className="text-sm" style={{ color: '#0C0D45', fontFamily: 'Inter, sans-serif' }}>
                Let AI Manually search the data
              </span>
              {/* circle-check icon */}
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle
                  cx="9"
                  cy="9"
                  r="7.5"
                  stroke={aiSearch ? '#3E5BA3' : '#DAE8FB'}
                  strokeWidth="1.5"
                  fill={aiSearch ? '#EAF1FC' : 'transparent'}
                />
                {aiSearch && (
                  <path d="M5.5 9l2.5 2.5L12.5 6" stroke="#3E5BA3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                )}
              </svg>
            </div>
          </motion.div>
        </div>

        {/* ── Context card (full width) ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="rounded-2xl overflow-hidden mb-6"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #DAE8FB',
            boxShadow: '0 1px 8px rgba(62,91,163,0.06)',
          }}
        >
          {/* Header band */}
          <div
            className="px-5 py-3"
            style={{ backgroundColor: '#DAE8FB' }}
          >
            <span
              className="text-sm font-medium"
              style={{ fontFamily: 'Caveat, cursive', fontSize: '1rem', color: '#3E5BA3', fontStyle: 'italic' }}
            >
              Additional content Researchflow should know?
            </span>
          </div>
          {/* Textarea */}
          <textarea
            placeholder="Description"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            rows={6}
            className="w-full px-5 py-4 text-sm outline-none resize-none"
            style={{
              backgroundColor: '#F0F4FA',
              border: 'none',
              color: '#0C0D45',
              fontFamily: 'Inter, sans-serif',
              display: 'block',
            }}
          />
        </motion.div>

        {/* ── Analyze button ─────────────────────────────────────────── */}
        {analysisError && (
          <div role="alert" style={{ marginBottom: 12, padding: '10px 14px', backgroundColor: '#FFF0F0', border: '1px solid #F0CCEA', borderRadius: 8, fontSize: '0.78rem', color: '#A03060' }}>
            {analysisError}
          </div>
        )}
        <div className="flex justify-end">
          <motion.button
            whileHover={isLoading ? {} : { scale: 1.03, backgroundColor: '#1a1b6e' }}
            whileTap={isLoading ? {} : { scale: 0.97 }}
            onClick={handleAnalyze}
            disabled={isLoading}
            className="flex items-center gap-3 px-7 py-3.5 rounded-2xl text-base font-semibold"
            style={{
              backgroundColor: isLoading ? '#3E5BA3' : '#0C0D45',
              color: '#FFFFFF',
              border: 'none',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '0.01em',
              opacity: isLoading ? 0.85 : 1,
              transition: 'background-color 0.2s',
            }}
          >
            {isLoading ? (
              <>
                {/* Spinning circle */}
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
                  <circle cx="9" cy="9" r="7" stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
                  <path d="M9 2a7 7 0 0 1 7 7" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Analyzing...
              </>
            ) : (
              <>
                Analyze Research
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M3 9h12M11 5l4 4-4 4" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

// ── inline sub-component: add-resource input ───────────────────────────────
function ResourceAdd({ onAdd }: { onAdd: (url: string) => void }) {
  const [val, setVal] = useState('')

  function commit() {
    const trimmed = val.trim()
    if (trimmed) {
      onAdd(trimmed)
      setVal('')
    }
  }

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-xl"
      style={{ backgroundColor: '#F0F4FA', border: '1.5px dashed #DAE8FB' }}
    >
      <input
        type="text"
        placeholder="Paste URL or link..."
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
        className="flex-1 text-xs outline-none bg-transparent"
        style={{ color: '#3E5BA3', fontFamily: 'Inter, sans-serif' }}
      />
      <button
        onClick={commit}
        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-150"
        style={{ backgroundColor: '#DAE8FB', border: 'none', cursor: 'pointer' }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#3E5BA3' }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#DAE8FB' }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M5 2v6M2 5h6" stroke="#3E5BA3" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}
