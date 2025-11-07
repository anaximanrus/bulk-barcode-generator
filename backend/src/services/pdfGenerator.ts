import PDFDocument from 'pdfkit'
import { generateBarcode, BarcodeOptions } from './barcodeGenerator.js'
import { PrintLayoutConfig, BarcodeConfig } from '@barcode-generator/shared'

// Type for PDFDocument instance
type PDFDocumentInstance = InstanceType<typeof PDFDocument>

interface BarcodeLayoutItem {
  x: number
  y: number
  widthMm: number
  heightMm: number
  isPrimary: boolean // true for primary, false for dual
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
 * Convert mm to points (PDF unit: 72 points per inch)
 */
const mmToPoints = (mm: number): number => (mm / 25.4) * 72

/**
 * Convert mm to pixels at 96 DPI (for barcode generation)
 */
const mmToPixels = (mm: number): number => Math.round((mm / 25.4) * 96)

/**
 * Convert pixels to points for PDF (from 96 DPI to 72 DPI)
 */
const pixelsToPoints = (px: number): number => (px / 96) * 72

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
  borderWidthMm: 0.25, // Thin cutting line (was 1mm - print center feedback)
  borderColor: '#FF0000',
})

/**
 * Calculate layout using actual generated barcode dimensions (same as PNG generator)
 */
const calculateLayoutWithActualSizes = (
  barcodes: Array<{ buffer: Buffer; width: number; height: number }>,
  barcodeConfig: BarcodeConfig,
  layoutConfig: PrintLayoutConfig
): LayoutCalculation => {
  const { canvasWidthCm, marginsMm, spacingMm, borderWidthMm, continuousMode } = layoutConfig

  const layout: BarcodeLayoutItem[] = []

  // Internal padding between barcode content and cutting lines (print center feedback)
  const internalPaddingMm = 2 // 2mm padding to prevent text from touching cutting lines

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
      isPrimary: i % 2 === 0 || !barcodeConfig.dualMode,
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
 * Generate print-ready PDF with barcodes
 */
export const generatePrintReadyPDF = async (
  dataList: string[],
  barcodeConfig: BarcodeConfig,
  layoutConfig?: Partial<PrintLayoutConfig>
): Promise<PDFDocumentInstance> => {
  // Merge with defaults
  const config: PrintLayoutConfig = {
    ...getDefaultLayoutConfig(),
    ...layoutConfig,
    marginsMm: {
      ...getDefaultLayoutConfig().marginsMm,
      ...layoutConfig?.marginsMm,
    },
  }

  console.log(`Generating print-ready PDF with ${dataList.length} barcodes...`)

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
  for (const data of dataList) {
    const sharp = (await import('sharp')).default

    // Generate primary barcode
    const primaryBarcode = await generateBarcode(data, primaryOptions)
    const primaryMetadata = await sharp(primaryBarcode.buffer).metadata()
    generatedBarcodes.push({
      buffer: primaryBarcode.buffer,
      width: primaryMetadata.width || mmToPixels(barcodeConfig.dimensions.width * 10),
      height: primaryMetadata.height || mmToPixels(barcodeConfig.dimensions.height * 10),
    })

    // Generate dual barcode if enabled
    if (dualOptions) {
      const dualBarcode = await generateBarcode(data, dualOptions)
      const dualMetadata = await sharp(dualBarcode.buffer).metadata()
      generatedBarcodes.push({
        buffer: dualBarcode.buffer,
        width: dualMetadata.width || mmToPixels((barcodeConfig.dualDimensions?.width || barcodeConfig.dimensions.width) * 10),
        height: dualMetadata.height || mmToPixels((barcodeConfig.dualDimensions?.height || barcodeConfig.dimensions.height) * 10),
      })
    }
  }

  console.log(`Generated ${generatedBarcodes.length} barcodes`)

  // Recalculate layout using actual barcode dimensions
  const actualLayout = calculateLayoutWithActualSizes(generatedBarcodes, barcodeConfig, config)

  console.log(`PDF canvas: ${actualLayout.canvasWidthMm}mm × ${actualLayout.canvasHeightMm}mm (96 DPI to 72 DPI PDF)`)

  // Create PDF document with calculated dimensions
  const doc = new PDFDocument({
    size: [mmToPoints(actualLayout.canvasWidthMm), mmToPoints(actualLayout.canvasHeightMm)],
    margin: 0, // We'll handle margins manually
  })

  // Internal padding in points (same as in layout calculation)
  const internalPaddingPoints = mmToPoints(2)

  // Draw each barcode with border
  for (let i = 0; i < actualLayout.barcodes.length; i++) {
    const layoutItem = actualLayout.barcodes[i]
    const barcodeData = generatedBarcodes[i]

    // Convert position to points for PDF
    const xPoints = mmToPoints(layoutItem.x)
    const yPoints = mmToPoints(layoutItem.y)

    // Convert actual barcode pixel dimensions to PDF points
    const barcodeWidthPoints = pixelsToPoints(barcodeData.width)
    const barcodeHeightPoints = pixelsToPoints(barcodeData.height)

    // Calculate border dimensions in points
    const borderPoints = mmToPoints(config.borderWidthMm)
    const halfBorderPoints = borderPoints / 2

    // Draw red border rectangle (includes internal padding for spacing)
    const rectX = xPoints + halfBorderPoints
    const rectY = yPoints + halfBorderPoints
    const rectWidth = barcodeWidthPoints + (internalPaddingPoints * 2) + borderPoints
    const rectHeight = barcodeHeightPoints + (internalPaddingPoints * 2) + borderPoints

    doc
      .save()
      .strokeColor(config.borderColor)
      .lineWidth(borderPoints)
      .rect(rectX, rectY, rectWidth, rectHeight)
      .stroke()
      .restore()

    // Draw barcode image inside border with internal padding
    const barcodeXPoints = xPoints + borderPoints + internalPaddingPoints
    const barcodeYPoints = yPoints + borderPoints + internalPaddingPoints

    doc.image(barcodeData.buffer, barcodeXPoints, barcodeYPoints, {
      width: barcodeWidthPoints,
      height: barcodeHeightPoints,
    })
  }

  console.log(`PDF generated successfully with ${actualLayout.barcodes.length} barcodes`)

  // Finalize PDF
  doc.end()

  return doc
}
