import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import CreateResearch from './pages/CreateResearch'
import LandingPage from './pages/LandingPage'
import AnalysisPage from './pages/AnalysisPage'
import InsightsPage from './pages/InsightsPage'
import { ResearchProvider } from './context/ResearchContext'

export default function App() {
  return (
    <BrowserRouter>
      <ResearchProvider>
        <div style={{ fontFamily: 'Inter, system-ui, sans-serif', backgroundColor: '#EAF1FC', minHeight: '100vh' }}>
          <Navbar />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/new" element={<CreateResearch />} />
            <Route path="/analysis" element={<AnalysisPage />} />
            <Route path="/insights" element={<InsightsPage />} />
          </Routes>
        </div>
      </ResearchProvider>
    </BrowserRouter>
  )
}

