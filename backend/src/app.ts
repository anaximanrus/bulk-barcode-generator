import express from 'express'
import cors from 'cors'
import { barcodeRouter } from './routes/barcode.routes.js'
import { errorHandler } from './middleware/error-handler.js'

export const app = express()

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Routes
app.use('/api/barcode', barcodeRouter)

// Error handling
app.use(errorHandler)

export default app
