import JsBarcode from "jsbarcode"
import type { BarcodeConfig } from "@/types/barcode"

export interface BarcodeGenerationOptions {
  data: string
  configuration: BarcodeConfig
  filename: string
}

export interface GeneratedBarcode {
  dataUrl: string
  filename: string
}

/**
 * Convert cm or inches to pixels (assuming 96 DPI)
 */
const convertToPixels = (value: number, unit: "cm" | "inches"): number => {
  const DPI = 96
  if (unit === "cm") {
    return Math.round((value / 2.54) * DPI)
  }
  // inches
  return Math.round(value * DPI)
}

/**
 * Process barcode data by removing ignored digits
 */
const processData = (data: string, configuration: BarcodeConfig): string => {
  const ignoreDigits = configuration.options.ignoreDigits
  if (!ignoreDigits || !ignoreDigits.enabled) {
    return data
  }

  const { position, count } = ignoreDigits

  if (position === "start") {
    return data.slice(count)
  } else {
    return data.slice(0, -count)
  }
}

/**
 * Generate a 1D barcode (Code128, EAN-13, EAN-8, UPC-A, Code39)
 */
export const generate1DBarcode = (options: BarcodeGenerationOptions): GeneratedBarcode | null => {
  const { data, configuration, filename } = options

  try {
    // Process data to remove ignored digits
    const processedData = processData(data, configuration)

    // Calculate exact dimensions
    const width = convertToPixels(configuration.dimensions.width, configuration.dimensions.unit)
    const height = convertToPixels(configuration.dimensions.height, configuration.dimensions.unit)

    // Check if vertical orientation
    const isVertical = configuration.orientation === "vertical"

    // When vertical, swap dimensions for generation, then rotate
    const generateWidth = isVertical ? height : width
    const generateHeight = isVertical ? width : height

    // For small barcodes (< 1cm), make barcode bars smaller and text bigger for readability
    // Only apply auto-adjustment if autoAdjustFont is true (default behavior for backward compatibility)
    const heightCm = configuration.dimensions.unit === "cm"
      ? configuration.dimensions.height
      : configuration.dimensions.height * 2.54
    const isSmallBarcode = heightCm < 1
    const shouldAutoAdjust = configuration.font.autoAdjustFont !== false // true if undefined or explicitly true

    // Adjust barcode height to leave more room for text on small barcodes
    const barcodeHeightMultiplier = isSmallBarcode && shouldAutoAdjust ? 0.4 : 0.5
    // Increase font size for small barcodes to improve readability
    const adjustedFontSize = isSmallBarcode && shouldAutoAdjust
      ? Math.min(configuration.font.size * 1.3, 14)
      : configuration.font.size
    const adjustedTextMargin = isSmallBarcode && shouldAutoAdjust ? 6 : 16

    // Map barcode type to JsBarcode format
    const formatMap: Record<string, string> = {
      code128: "CODE128",
      ean13: "EAN13",
      ean8: "EAN8",
      upca: "UPC",
      code39: "CODE39",
    }

    const format = formatMap[configuration.type] || "CODE128"

    // Create temporary canvas for JsBarcode generation
    const tempCanvas = document.createElement("canvas")

    // Generate barcode on temporary canvas (use swapped dimensions for vertical)
    JsBarcode(tempCanvas, processedData, {
      format,
      width: configuration.options.stretch ? generateWidth / 100 : 2,
      height: configuration.options.stretch ? generateHeight * 0.7 : generateHeight * barcodeHeightMultiplier,
      displayValue: configuration.options.showText,
      text: processedData,
      font: configuration.font.family,
      fontSize: adjustedFontSize,
      textMargin: adjustedTextMargin,
      margin: 10,
      background: "#ffffff",
      lineColor: "#000000",
    })

    // Create intermediate canvas with swapped dimensions for vertical orientation
    const intermediateCanvas = document.createElement("canvas")
    intermediateCanvas.width = generateWidth
    intermediateCanvas.height = generateHeight

    // Draw the generated barcode onto intermediate canvas
    const intermediateCtx = intermediateCanvas.getContext("2d")
    if (intermediateCtx) {
      // Fill with white background
      intermediateCtx.fillStyle = "#ffffff"
      intermediateCtx.fillRect(0, 0, generateWidth, generateHeight)

      // Draw the barcode centered or stretched to fill
      if (configuration.options.stretch) {
        // Stretch to fill entire canvas
        intermediateCtx.drawImage(tempCanvas, 0, 0, generateWidth, generateHeight)
      } else {
        // Center the barcode
        const x = (generateWidth - tempCanvas.width) / 2
        const y = (generateHeight - tempCanvas.height) / 2
        intermediateCtx.drawImage(tempCanvas, x, y)
      }
    }

    // Create final canvas with correct dimensions
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext("2d")
    if (ctx) {
      // Fill with white background
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, width, height)

      if (isVertical) {
        // Rotate 90 degrees clockwise for vertical orientation
        ctx.save()
        ctx.translate(width / 2, height / 2)
        ctx.rotate(Math.PI / 2)
        ctx.drawImage(intermediateCanvas, -generateWidth / 2, -generateHeight / 2)
        ctx.restore()
      } else {
        // Draw directly for horizontal orientation
        ctx.drawImage(intermediateCanvas, 0, 0)
      }
    }

    // Convert canvas to data URL
    const dataUrl = canvas.toDataURL("image/png")

    return { dataUrl, filename }
  } catch (error) {
    console.error("Error generating 1D barcode:", error)
    return null
  }
}

/**
 * Generate a QR code
 */
export const generateQRCode = (options: BarcodeGenerationOptions): GeneratedBarcode | null => {
  const { filename } = options

  try {
    // For QR codes, we'll use a library in the component
    // This function returns the configuration for the QR component
    return {
      dataUrl: "", // Will be generated by QRCode component
      filename,
    }
  } catch (error) {
    console.error("Error generating QR code:", error)
    return null
  }
}

/**
 * Generate barcode based on type
 */
export const generateBarcode = (options: BarcodeGenerationOptions): GeneratedBarcode | null => {
  const { configuration } = options

  if (configuration.type === "qr") {
    return generateQRCode(options)
  }

  return generate1DBarcode(options)
}

/**
 * Generate multiple barcodes
 */
export const generateBarcodes = async (
  dataList: string[],
  configuration: BarcodeConfig
): Promise<GeneratedBarcode[]> => {
  const results: GeneratedBarcode[] = []

  for (let i = 0; i < dataList.length; i++) {
    const data = dataList[i]
    const filename = `barcode_${data}_${configuration.dimensions.width}x${configuration.dimensions.height}${configuration.dimensions.unit}.png`

    const result = generateBarcode({ data, configuration, filename })
    if (result) {
      results.push(result)
    }

    // If dual mode is enabled, generate second version
    if (configuration.dualMode && configuration.dualDimensions) {
      const dualConfig: BarcodeConfig = {
        ...configuration,
        dimensions: configuration.dualDimensions,
        font: configuration.dualFont || configuration.font, // Use dualFont if available
        dualMode: false, // Prevent infinite recursion
      }
      const dualFilename = `barcode_${data}_${dualConfig.dimensions.width}x${dualConfig.dimensions.height}${dualConfig.dimensions.unit}.png`

      const dualResult = generateBarcode({
        data,
        configuration: dualConfig,
        filename: dualFilename,
      })
      if (dualResult) {
        results.push(dualResult)
      }
    }
  }

  return results
}
