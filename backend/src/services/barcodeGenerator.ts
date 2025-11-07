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
  autoAdjustFont?: boolean
  ignoreDigits?: IgnoreDigits
  orientation?: 'horizontal' | 'vertical'
}

export interface GeneratedBarcode {
  buffer: Buffer
  filename: string
  mimeType: string
}

/**
 * Convert cm or inches to pixels (96 DPI to match frontend preview)
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

    // Map font family to bwip-js font identifier
    const fontIdentifier = getFontIdentifier(options.fontFamily)

    // For small barcodes (< 1cm), make barcode bars smaller and text bigger for readability
    // Only apply auto-adjustment if autoAdjustFont is true (default behavior for backward compatibility)
    const heightCm = options.unit === 'cm' ? options.height : options.height * 2.54
    const isSmallBarcode = heightCm < 1
    const shouldAutoAdjust = options.autoAdjustFont !== false // true if undefined or explicitly true

    // Scale determines barcode bar size - smaller scale = smaller bars = more room for text
    const barcodeScale = isSmallBarcode && shouldAutoAdjust ? 1 : 2
    // Increase font size for small barcodes to improve readability
    const adjustedFontSize = isSmallBarcode && shouldAutoAdjust ? Math.min(options.fontSize * 1.3, 14) : options.fontSize
    const adjustedTextOffset = isSmallBarcode && shouldAutoAdjust ? 6 : 12

    // Generate barcode with bwip-js - let it create at natural size with text
    const bwipOptions: any = {
      bcid: barcodeType,
      text: processedData,
      scale: barcodeScale, // Smaller scale for small barcodes = thinner bars
      includetext: options.showText,
      textxalign: 'center',
      textsize: adjustedFontSize, // Bigger text for small barcodes
      textyoffset: adjustedTextOffset, // Vertical spacing between barcode and text
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
    } else {
      // For 1D barcodes, set bar height smaller for small barcodes to leave room for text
      if (isSmallBarcode && shouldAutoAdjust) {
        bwipOptions.height = 8 // Smaller bar height for small barcodes
      }
    }

    // Generate barcode PNG buffer
    let buffer = await bwipjs.toBuffer(bwipOptions)

    // For vertical orientation, we need to generate with swapped dimensions
    // Then rotate 90 degrees so the barcode reads correctly when the label is vertical
    const isVertical = options.orientation === 'vertical'

    // When vertical, swap width/height so after rotation the barcode fills the space correctly
    const resizeWidthPx = isVertical ? heightPx : widthPx
    const resizeHeightPx = isVertical ? widthPx : heightPx

    // Resize to target dimensions with sharpening for crisp text
    // If stretch is enabled, force exact dimensions
    // Otherwise, fit within the dimensions maintaining aspect ratio
    if (options.stretch) {
      // Stretch mode: force exact dimensions
      buffer = await sharp(buffer)
        .resize(resizeWidthPx, resizeHeightPx, {
          fit: 'fill', // Ignore aspect ratio and fill exact dimensions
          kernel: sharp.kernel.lanczos3, // High-quality resize kernel
        })
        .sharpen({
          sigma: 0.5, // Subtle sharpening
          m1: 1.0,    // Flatten (prevent halos)
          m2: 0.5,    // Jagged (edge definition)
        })
        .png({
          compressionLevel: 9, // Maximum compression
          adaptiveFiltering: false, // Faster, better for barcodes
        })
        .toBuffer()
    } else {
      // Normal mode: fit within dimensions maintaining aspect ratio
      buffer = await sharp(buffer)
        .resize(resizeWidthPx, resizeHeightPx, {
          fit: 'inside', // Maintain aspect ratio, fit within bounds
          withoutEnlargement: false,
          kernel: sharp.kernel.lanczos3, // High-quality resize kernel
        })
        .sharpen({
          sigma: 0.5, // Subtle sharpening
          m1: 1.0,    // Flatten (prevent halos)
          m2: 0.5,    // Jagged (edge definition)
        })
        .png({
          compressionLevel: 9, // Maximum compression
          adaptiveFiltering: false, // Faster, better for barcodes
        })
        .toBuffer()
    }

    // Rotate 90 degrees clockwise for vertical orientation
    // This makes the barcode readable when the label is in portrait/vertical position
    if (isVertical) {
      buffer = await sharp(buffer)
        .rotate(90)
        .png({
          compressionLevel: 9,
          adaptiveFiltering: false,
        })
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
