import sharp from 'sharp'
import { generateBarcode, BarcodeOptions } from './barcodeGenerator.js'
import { PrintLayoutConfig, BarcodeConfig } from '@barcode-generator/shared'

interface BarcodeLayoutItem {
  x: number
  y: number
  widthMm: number
  heightMm: number
  isPrimary: boolean
}

interface LayoutCalculation {
  canvasWidthMm: number
  canvasHeightMm: number
  barcodes: BarcodeLayoutItem[]
}

/**
 * Convert cm to mm
 */
const cmToMm = (cm: number): number => cm * 10

/**
 * Convert mm to pixels at 96 DPI (matches frontend preview)
 */
const mmToPixels = (mm: number): number => Math.round((mm / 25.4) * 96)

/**
 * Convert cm/inches to mm
 */
const toMm = (value: number, unit: 'cm' | 'inches'): number => {
  if (unit === 'cm') return value * 10
  return value * 25.4
}

/**
 * Convert barcode config dimensions to pixels accounting for units and orientation
 */
const convertConfigToPixels = (width: number, height: number, unit: 'cm' | 'inches', isVertical: boolean): { width: number; height: number } => {
  // Convert to pixels at 96 DPI
  const widthPx = unit === 'cm' ? Math.round((width / 2.54) * 96) : Math.round(width * 96)
  const heightPx = unit === 'cm' ? Math.round((height / 2.54) * 96) : Math.round(height * 96)

  // After rotation, dimensions swap for vertical orientation
  if (isVertical) {
    return { width: heightPx, height: widthPx }
  }
  return { width: widthPx, height: heightPx }
}

/**
 * Calculate grid layout for barcodes with dual mode support
 * Places primary and dual barcodes in columns: [primary, dual, primary, dual, ...]
 */
const calculateLayout = (
  dataCount: number,
  barcodeConfig: BarcodeConfig,
  layoutConfig: PrintLayoutConfig
): LayoutCalculation => {
  const { canvasWidthCm, marginsMm, spacingMm, borderWidthMm } = layoutConfig
  const canvasWidthMm = cmToMm(canvasWidthCm)

  // Convert primary barcode dimensions to mm
  const primaryWidthMm = toMm(barcodeConfig.dimensions.width, barcodeConfig.dimensions.unit)
  const primaryHeightMm = toMm(barcodeConfig.dimensions.height, barcodeConfig.dimensions.unit)

  // Convert dual barcode dimensions to mm (if dual mode enabled)
  let dualWidthMm = primaryWidthMm
  let dualHeightMm = primaryHeightMm
  if (barcodeConfig.dualMode && barcodeConfig.dualDimensions) {
    dualWidthMm = toMm(barcodeConfig.dualDimensions.width, barcodeConfig.dualDimensions.unit)
    dualHeightMm = toMm(barcodeConfig.dualDimensions.height, barcodeConfig.dualDimensions.unit)
  }

  const barcodes: BarcodeLayoutItem[] = []

  // Calculate how many columns fit based on largest barcode width
  const maxBarcodeWidth = Math.max(primaryWidthMm, dualWidthMm)
  const cellWidth = maxBarcodeWidth + (borderWidthMm * 2) + spacingMm
  const availableWidth = canvasWidthMm - marginsMm.left - marginsMm.right
  const columnsPerRow = Math.floor(availableWidth / cellWidth)

  if (columnsPerRow < 1) {
    throw new Error('Barcode is too wide to fit on canvas with specified margins')
  }

  // In dual mode: each data item creates 2 barcodes (primary + dual) placed in adjacent columns
  let currentX = marginsMm.left
  let currentY = marginsMm.top
  let currentColumn = 0
  let currentRowHeight = 0

  for (let i = 0; i < dataCount; i++) {
    // Add primary barcode
    const primaryCellHeight = primaryHeightMm + (borderWidthMm * 2)

    barcodes.push({
      x: currentX,
      y: currentY,
      widthMm: primaryWidthMm,
      heightMm: primaryHeightMm,
      isPrimary: true,
    })

    currentRowHeight = Math.max(currentRowHeight, primaryCellHeight)
    currentColumn++
    currentX += cellWidth

    // Add dual barcode if enabled
    if (barcodeConfig.dualMode) {
      // Check if dual barcode fits in current row
      if (currentColumn >= columnsPerRow) {
        // Move to next row
        currentY += currentRowHeight + spacingMm
        currentX = marginsMm.left
        currentColumn = 0
        currentRowHeight = 0
      }

      const dualCellHeight = dualHeightMm + (borderWidthMm * 2)

      barcodes.push({
        x: currentX,
        y: currentY,
        widthMm: dualWidthMm,
        heightMm: dualHeightMm,
        isPrimary: false,
      })

      currentRowHeight = Math.max(currentRowHeight, dualCellHeight)
      currentColumn++
      currentX += cellWidth
    }

    // Check if we need to move to next row for next data item
    if (currentColumn >= columnsPerRow) {
      currentY += currentRowHeight + spacingMm
      currentX = marginsMm.left
      currentColumn = 0
      currentRowHeight = 0
    }
  }

  // Calculate final canvas height
  const canvasHeightMm = currentY + currentRowHeight + marginsMm.bottom

  return {
    canvasWidthMm,
    canvasHeightMm,
    barcodes,
  }
}

/**
 * Calculate layout using actual generated barcode dimensions
 */
const calculateLayoutWithActualSizes = (
  barcodes: Array<{ buffer: Buffer; width: number; height: number }>,
  barcodeConfig: BarcodeConfig,
  layoutConfig: PrintLayoutConfig
): LayoutCalculation => {
  const { canvasWidthCm, marginsMm, spacingMm, borderWidthMm, continuousMode } = layoutConfig

  const layout: BarcodeLayoutItem[] = []

  // Internal padding between barcode content and cutting lines (minimal spacing)
  const internalPaddingMm = 0.25 // 0.25mm padding between barcode and border

  // Find the maximum barcode width in pixels
  const maxBarcodeWidthPx = Math.max(...barcodes.map((b) => b.width))
  const maxBarcodeWidthMm = (maxBarcodeWidthPx / 96) * 25.4 // Convert pixels to mm at 96 DPI

  // Calculate cell width including internal padding
  const cellWidthMm = maxBarcodeWidthMm + (internalPaddingMm * 2) + (borderWidthMm * 2) + spacingMm

  let canvasWidthMm: number
  let columnsPerRow: number

  if (continuousMode) {
    // CONTINUOUS MODE: Single row, dynamic canvas width
    columnsPerRow = barcodes.length // All barcodes in one row
    canvasWidthMm = marginsMm.left + marginsMm.right + (cellWidthMm * barcodes.length)
  } else {
    // PAGE MODE: Fixed width, multiple rows
    canvasWidthMm = cmToMm(canvasWidthCm)
    const availableWidthMm = canvasWidthMm - marginsMm.left - marginsMm.right
    columnsPerRow = Math.floor(availableWidthMm / cellWidthMm)

    if (columnsPerRow < 1) {
      throw new Error('Barcode is too wide to fit on canvas with specified margins')
    }
  }

  let currentX = marginsMm.left
  let currentY = marginsMm.top
  let currentColumn = 0
  let currentRowHeight = 0

  for (let i = 0; i < barcodes.length; i++) {
    const barcode = barcodes[i]

    // Convert actual barcode dimensions to mm
    const barcodeWidthMm = (barcode.width / 96) * 25.4
    const barcodeHeightMm = (barcode.height / 96) * 25.4
    const cellHeightMm = barcodeHeightMm + (internalPaddingMm * 2) + (borderWidthMm * 2)

    layout.push({
      x: currentX,
      y: currentY,
      widthMm: barcodeWidthMm,
      heightMm: barcodeHeightMm,
      isPrimary: i % 2 === 0 || !barcodeConfig.dualMode, // Assume alternating primary/dual
    })

    currentRowHeight = Math.max(currentRowHeight, cellHeightMm)
    currentColumn++
    currentX += cellWidthMm

    // Move to next row if needed (only in page mode, not continuous mode)
    if (!continuousMode && currentColumn >= columnsPerRow) {
      currentY += currentRowHeight + spacingMm
      currentX = marginsMm.left
      currentColumn = 0
      currentRowHeight = 0
    }
  }

  // Calculate final canvas height
  const canvasHeightMm = currentY + currentRowHeight + marginsMm.bottom

  return {
    canvasWidthMm,
    canvasHeightMm,
    barcodes: layout,
  }
}

/**
 * Default print layout configuration
 */
const getDefaultLayoutConfig = (): PrintLayoutConfig => ({
  canvasWidthCm: 100,
  continuousMode: false,
  marginsMm: {
    top: 10,
    bottom: 10,
    left: 10,
    right: 10,
  },
  spacingMm: 5,
  borderWidthMm: 0.5, // Minimum reliable line width for consistent printing across all printers
  borderColor: '#FF0000',
})

/**
 * Create SVG border overlay with internal padding
 */
const createBorderSvg = (widthPx: number, heightPx: number, borderColor: string, borderWidthPx: number): Buffer => {
  // Use actual border width in pixels for thinner lines
  const strokeWidth = Math.max(0.5, borderWidthPx) // Minimum 0.5px for visibility
  const halfStroke = strokeWidth / 2

  const svg = `
    <svg width="${widthPx}" height="${heightPx}">
      <rect x="${halfStroke}" y="${halfStroke}" width="${widthPx - strokeWidth}" height="${heightPx - strokeWidth}"
            fill="none" stroke="${borderColor}" stroke-width="${strokeWidth}"/>
    </svg>
  `
  return Buffer.from(svg)
}

/**
 * Generate print-ready PNG with barcodes
 */
export const generatePrintReadyPNG = async (
  dataList: string[],
  barcodeConfig: BarcodeConfig,
  layoutConfig?: Partial<PrintLayoutConfig>
): Promise<Buffer> => {
  // Merge with defaults
  const config: PrintLayoutConfig = {
    ...getDefaultLayoutConfig(),
    ...layoutConfig,
    marginsMm: {
      ...getDefaultLayoutConfig().marginsMm,
      ...layoutConfig?.marginsMm,
    },
  }

  // Calculate layout
  const layout = calculateLayout(dataList.length, barcodeConfig, config)

  // Calculate canvas dimensions in pixels at 96 DPI
  const canvasWidthPx = mmToPixels(layout.canvasWidthMm)
  const canvasHeightPx = mmToPixels(layout.canvasHeightMm)
  const borderWidthPx = mmToPixels(config.borderWidthMm)

  console.log(`Creating PNG canvas: ${canvasWidthPx}px × ${canvasHeightPx}px (${layout.canvasWidthMm}mm × ${layout.canvasHeightMm}mm at 96 DPI)`)

  // Convert barcode config to BarcodeOptions
  const primaryOptions: BarcodeOptions = {
    type: barcodeConfig.type,
    width: barcodeConfig.dimensions.width,
    height: barcodeConfig.dimensions.height,
    unit: barcodeConfig.dimensions.unit,
    showText: barcodeConfig.options.showText,
    stretch: barcodeConfig.options.stretch,
    fontFamily: barcodeConfig.font.family,
    fontSize: barcodeConfig.font.size,
    ignoreDigits: barcodeConfig.options.ignoreDigits,
    orientation: barcodeConfig.orientation || 'horizontal',
  }

  // Prepare dual mode options if enabled
  let dualOptions: BarcodeOptions | undefined
  if (barcodeConfig.dualMode && barcodeConfig.dualDimensions) {
    dualOptions = {
      ...primaryOptions,
      width: barcodeConfig.dualDimensions.width,
      height: barcodeConfig.dualDimensions.height,
      unit: barcodeConfig.dualDimensions.unit,
      ignoreDigits: barcodeConfig.options.ignoreDigits,
      orientation: barcodeConfig.orientation || 'horizontal',
    }
  }

  // Generate all barcodes and get their actual dimensions
  const generatedBarcodes: Array<{ buffer: Buffer; width: number; height: number }> = []
  const isVertical = barcodeConfig.orientation === 'vertical'

  for (const data of dataList) {
    // Generate primary barcode
    const primaryBarcode = await generateBarcode(data, primaryOptions)
    const primaryMetadata = await sharp(primaryBarcode.buffer).metadata()

    // Calculate fallback dimensions accounting for orientation
    const fallbackDims = convertConfigToPixels(
      barcodeConfig.dimensions.width,
      barcodeConfig.dimensions.height,
      barcodeConfig.dimensions.unit,
      isVertical
    )

    generatedBarcodes.push({
      buffer: primaryBarcode.buffer,
      width: primaryMetadata.width || fallbackDims.width,
      height: primaryMetadata.height || fallbackDims.height,
    })

    // Generate dual barcode if enabled
    if (dualOptions) {
      const dualBarcode = await generateBarcode(data, dualOptions)
      const dualMetadata = await sharp(dualBarcode.buffer).metadata()

      // Calculate fallback dimensions for dual barcode
      const dualWidth = barcodeConfig.dualDimensions?.width || barcodeConfig.dimensions.width
      const dualHeight = barcodeConfig.dualDimensions?.height || barcodeConfig.dimensions.height
      const dualUnit = barcodeConfig.dualDimensions?.unit || barcodeConfig.dimensions.unit
      const dualFallbackDims = convertConfigToPixels(dualWidth, dualHeight, dualUnit, isVertical)

      generatedBarcodes.push({
        buffer: dualBarcode.buffer,
        width: dualMetadata.width || dualFallbackDims.width,
        height: dualMetadata.height || dualFallbackDims.height,
      })
    }
  }

  console.log(`Generated ${generatedBarcodes.length} barcodes`)

  // Recalculate layout using actual barcode dimensions
  const actualLayout = calculateLayoutWithActualSizes(generatedBarcodes, barcodeConfig, config)

  // Calculate canvas dimensions based on actual layout
  const actualCanvasWidthPx = mmToPixels(actualLayout.canvasWidthMm)
  const actualCanvasHeightPx = mmToPixels(actualLayout.canvasHeightMm)

  console.log(`Adjusted canvas: ${actualCanvasWidthPx}px × ${actualCanvasHeightPx}px based on actual barcode sizes`)

  // Internal padding in pixels (same as in layout calculation)
  const internalPaddingPx = mmToPixels(0.25)

  // Create composite operations for all barcodes and borders
  const compositeOperations: Array<{ input: Buffer; top: number; left: number }> = []

  for (let i = 0; i < actualLayout.barcodes.length; i++) {
    const layoutItem = actualLayout.barcodes[i]
    const barcodeData = generatedBarcodes[i]

    // Convert position to pixels
    const xPx = mmToPixels(layoutItem.x)
    const yPx = mmToPixels(layoutItem.y)

    // Use actual barcode dimensions
    const actualWidthPx = barcodeData.width
    const actualHeightPx = barcodeData.height

    // Create border SVG using actual dimensions plus internal padding
    const borderWidthTotal = actualWidthPx + (internalPaddingPx * 2) + (borderWidthPx * 2)
    const borderHeightTotal = actualHeightPx + (internalPaddingPx * 2) + (borderWidthPx * 2)
    const borderSvg = createBorderSvg(borderWidthTotal, borderHeightTotal, config.borderColor, borderWidthPx)

    // Add border overlay
    compositeOperations.push({
      input: borderSvg,
      top: yPx,
      left: xPx,
    })

    // Add barcode image inside border with internal padding
    compositeOperations.push({
      input: barcodeData.buffer,
      top: yPx + borderWidthPx + internalPaddingPx,
      left: xPx + borderWidthPx + internalPaddingPx,
    })
  }

  console.log(`Compositing ${compositeOperations.length} elements onto canvas`)

  // Create blank white canvas and composite all elements using actual dimensions
  const outputBuffer = await sharp({
    create: {
      width: actualCanvasWidthPx,
      height: actualCanvasHeightPx,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite(compositeOperations)
    .png({ compressionLevel: 9 })
    .toBuffer()

  console.log(`PNG generated successfully: ${outputBuffer.length} bytes`)

  return outputBuffer
}
