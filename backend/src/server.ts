import { app } from './app.js'
import dotenv from 'dotenv'
import { loadFonts } from './services/fontLoader.js'

dotenv.config()

const PORT = process.env.PORT || 4000

// Load custom fonts before starting server
loadFonts()

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`)
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
})
