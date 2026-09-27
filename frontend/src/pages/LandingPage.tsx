import AskSection from '../components/AskSection'
import Footer from '../components/Footer'
import Hero from '../components/Hero'
import HowItWorks from '../components/HowItWorks'
import InsightsSection from '../components/InsightsSection'
import MyLibrary from '../components/MyLibrary'
import ProblemSection from '../components/ProblemSection'
import ResearchMapPreview from '../components/ResearchMapPreview'
import AboutSection from '../components/AboutSection'

export default function LandingPage() {
  return (
    <>
      <Hero />
      <MyLibrary />
      <ProblemSection />
      <HowItWorks />
      <ResearchMapPreview />
      <AskSection />
      <InsightsSection />
      <AboutSection />
      <Footer />
    </>
  )
}
