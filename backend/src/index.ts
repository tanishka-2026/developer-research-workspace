import cors from 'cors'
import express from 'express'

const app = express()
const PORT = 3001

// Middleware
app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

// Health check — confirms the backend is reachable
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'ResearchNest backend is running.' })
})

// Start server
app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`)
})
