import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import CreateResearch from './pages/CreateResearch'
import LandingPage from './pages/LandingPage'
import AnalysisPage from './pages/AnalysisPage'

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ fontFamily: 'Inter, system-ui, sans-serif', backgroundColor: '#EAF1FC', minHeight: '100vh' }}>
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/new" element={<CreateResearch />} />
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route path="/about" element={<PlaceholderPage title="About" />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center py-40">
      <p style={{ color: '#3E5BA3', fontFamily: 'Inter, sans-serif', fontSize: '1.25rem' }}>
        {title} — coming soon
      </p>
    </div>
  )
}
