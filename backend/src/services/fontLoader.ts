import bwipjs from 'bwip-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Font mapping: frontend name → backend font identifier and file
const FONT_MAP = {
  Roboto: {
    identifier: 'ROBOTO',
    file: 'Roboto-Regular.ttf',
  },
  'Open Sans': {
    identifier: 'OPENSANS',
    file: 'OpenSans-Regular.ttf',
  },
  Lato: {
    identifier: 'LATO',
    file: 'Lato-Regular.ttf',
  },
  Montserrat: {
    identifier: 'MONTSERRAT',
    file: 'Montserrat-Regular.ttf',
  },
  'Courier Prime': {
    identifier: 'COURIERPRIME',
    file: 'CourierPrime-Regular.ttf',
  },
}

/**
 * Load all Google Fonts for use with bwip-js
 */
export const loadFonts = (): void => {
  try {
    const fontsDir = path.resolve(__dirname, '../../fonts')

    console.log('Loading custom fonts for barcode generation...')

    let loadedCount = 0
    Object.entries(FONT_MAP).forEach(([fontName, fontInfo]) => {
      const fontPath = path.join(fontsDir, fontInfo.file)

      if (!fs.existsSync(fontPath)) {
        console.warn(`Font file not found: ${fontPath}`)
        return
      }

      try {
        const fontData = fs.readFileSync(fontPath, 'binary')

        // Load font with bwip-js
        // Parameters: (fontName, sizeMultiplier, fontData)
        // 100 means use the font's default size (100%)
        bwipjs.loadFont(fontInfo.identifier, 100, fontData)

        console.log(`✓ Loaded font: ${fontName} (${fontInfo.identifier})`)
        loadedCount++
      } catch (fontError) {
        console.warn(`Failed to load ${fontName}: ${fontError instanceof Error ? fontError.message : 'Unknown error'}`)
      }
    })

    console.log(`Font loading complete. ${loadedCount}/${Object.keys(FONT_MAP).length} fonts loaded successfully.`)

    if (loadedCount === 0) {
      console.warn('Warning: No custom fonts were loaded. Barcodes will use default fonts.')
    }
  } catch (error) {
    console.error('Error in font loading process:', error)
    console.warn('Continuing without custom fonts...')
  }
}

/**
 * Map frontend font family to bwip-js font identifier
 */
export const getFontIdentifier = (fontFamily: string): string | undefined => {
  const fontInfo = FONT_MAP[fontFamily as keyof typeof FONT_MAP]
  return fontInfo?.identifier
}

/**
 * Get list of available font families
 */
export const getAvailableFonts = (): string[] => {
  return Object.keys(FONT_MAP)
}
