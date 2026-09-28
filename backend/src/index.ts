import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import analyzeRouter from './routes/analyze'
import chatRouter from './routes/chat'

const app = express()
const PORT = Number(process.env.PORT) || 3001
// Middleware
app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

// Health check — confirms the backend is reachable
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'ResearchNest backend is running.' })
})

// Routes
app.use('/api/analyze', analyzeRouter)
app.use('/api/chat', chatRouter)

// Start server
app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`)
})
