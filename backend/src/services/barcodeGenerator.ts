import bwipjs from 'bwip-js'
import sharp from 'sharp'
import { getFontIdentifier } from './fontLoader.js'

export interface IgnoreDigits {
  enabled: boolean
  position: 'start' | 'end'
  count: number
}

export interface BarcodeOptions {
  type: 'code128' | 'qr' | 'ean13' | 'ean8' | 'upca' | 'code39'
  width: number
  height: number
  unit: 'cm' | 'inches'
  showText: boolean
  stretch: boolean
  fontFamily: string
  fontSize: number
  ignoreDigits?: IgnoreDigits
}

export interface GeneratedBarcode {
  buffer: Buffer
  filename: string
  mimeType: string
}

/**
 * Convert cm or inches to pixels (96 DPI)
 */
const convertToPixels = (value: number, unit: 'cm' | 'inches'): number => {
  const DPI = 96
  if (unit === 'cm') {
    return Math.round((value / 2.54) * DPI)
  }
  return Math.round(value * DPI)
}

/**
 * Map frontend barcode type to bwip-js barcode type
 */
const mapBarcodeType = (type: string): string => {
  const typeMap: Record<string, string> = {
    code128: 'code128',
    qr: 'qrcode',
    ean13: 'ean13',
    ean8: 'ean8',
    upca: 'upca',
    code39: 'code39',
  }
  return typeMap[type] || 'code128'
}

/**
 * Process barcode data by removing ignored digits
 */
const processData = (data: string, ignoreDigits?: IgnoreDigits): string => {
  if (!ignoreDigits || !ignoreDigits.enabled) {
    return data
  }

  const { position, count } = ignoreDigits

  if (position === 'start') {
    return data.slice(count)
  } else {
    return data.slice(0, -count)
  }
}

/**
 * Generate a barcode using bwip-js
 */
export const generateBarcode = async (
  data: string,
  options: BarcodeOptions
): Promise<GeneratedBarcode> => {
  try {
    // Process data to remove ignored digits
    const processedData = processData(data, options.ignoreDigits)

    const widthPx = convertToPixels(options.width, options.unit)
    const heightPx = convertToPixels(options.height, options.unit)
    const barcodeType = mapBarcodeType(options.type)

    // Calculate scale for better quality
    const scale = options.type === 'qr' ? 4 : 2

    // Map font family to bwip-js font identifier
    const fontIdentifier = getFontIdentifier(options.fontFamily)

    // Generate barcode with bwip-js
    const bwipOptions: any = {
      bcid: barcodeType,
      text: processedData,
      scale,
      includetext: options.showText,
      textxalign: 'center',
      textsize: options.fontSize,
      backgroundcolor: 'ffffff',
      barcolor: '000000',
    }

    // Apply custom font if available
    if (fontIdentifier) {
      bwipOptions.textfont = fontIdentifier
    }

    // Type-specific options
    if (options.type === 'qr') {
      bwipOptions.eclevel = 'M' // Error correction level
      const qrSize = Math.min(widthPx, heightPx)
      bwipOptions.width = qrSize / scale
      bwipOptions.height = qrSize / scale
    } else {
      // 1D barcode options
      if (options.stretch) {
        bwipOptions.width = widthPx / scale / 2
        bwipOptions.height = heightPx / scale
      } else {
        bwipOptions.height = heightPx / scale / 2
      }
    }

    // Generate barcode PNG buffer
    let buffer = await bwipjs.toBuffer(bwipOptions)

    // Resize if needed using sharp
    if (options.stretch || options.type === 'qr') {
      buffer = await sharp(buffer)
        .resize(widthPx, heightPx, {
          fit: 'fill',
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        })
        .png()
        .toBuffer()
    }

    const filename = `barcode_${processedData}_${options.width}x${options.height}${options.unit}.png`

    return {
      buffer,
      filename,
      mimeType: 'image/png',
    }
  } catch (error) {
    console.error('Error generating barcode:', error)
    throw new Error(`Failed to generate barcode for data: ${data}`)
  }
}

/**
 * Generate multiple barcodes
 */
export const generateBarcodes = async (
  dataList: string[],
  options: BarcodeOptions,
  dualMode = false,
  dualOptions?: BarcodeOptions
): Promise<GeneratedBarcode[]> => {
  const results: GeneratedBarcode[] = []

  for (const data of dataList) {
    // Generate primary barcode
    const barcode = await generateBarcode(data, options)
    results.push(barcode)

    // Generate dual barcode if enabled
    if (dualMode && dualOptions) {
      const dualBarcode = await generateBarcode(data, dualOptions)
      results.push(dualBarcode)
    }
  }

  return results
}
