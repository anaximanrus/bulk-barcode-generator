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

    // Calculate dimensions based on barcode size for variable DPI
    const heightCm = configuration.dimensions.unit === "cm"
      ? configuration.dimensions.height
      : configuration.dimensions.height * 2.54
    const isSmallBarcode = heightCm < 1

    // Use 3x DPI (288) for small barcodes to improve text sharpness
    const DPI = isSmallBarcode ? 288 : 96

    // Convert to pixels at appropriate DPI
    const width = configuration.dimensions.unit === "cm"
      ? Math.round((configuration.dimensions.width / 2.54) * DPI)
      : Math.round(configuration.dimensions.width * DPI)
    const height = configuration.dimensions.unit === "cm"
      ? Math.round((configuration.dimensions.height / 2.54) * DPI)
      : Math.round(configuration.dimensions.height * DPI)

    // Check if vertical orientation
    const isVertical = configuration.orientation === "vertical"

    // Use original dimensions for generation, then rotate
    const generateWidth = width
    const generateHeight = height

    // For small barcodes (< 1cm), adjust font and spacing for better readability
    // Only apply auto-adjustment if autoAdjustFont is true (default behavior for backward compatibility)
    const shouldAutoAdjust = configuration.font.autoAdjustFont !== false // true if undefined or explicitly true

    // Reduce font size for small barcodes to fit more pixels per character (improves sharpness)
    const adjustedFontSize = isSmallBarcode && shouldAutoAdjust
      ? Math.max(configuration.font.size * 0.7, 6)  // Scale down to 70%, minimum 6px
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

    // Generate barcode on temporary canvas
    // Use consistent height (90%) regardless of stretch mode - stretch only affects rendering
    JsBarcode(tempCanvas, processedData, {
      format,
      width: configuration.options.stretch ? generateWidth / 100 : 2,
      height: generateHeight * 0.9, // Always 90% of canvas height for consistent size
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

    // Create canvas for rotation if needed
    let rotationCanvas = intermediateCanvas
    if (isVertical) {
      rotationCanvas = document.createElement("canvas")
      rotationCanvas.width = generateHeight
      rotationCanvas.height = generateWidth
      const rotCtx = rotationCanvas.getContext("2d")
      if (rotCtx) {
        rotCtx.fillStyle = "#ffffff"
        rotCtx.fillRect(0, 0, rotationCanvas.width, rotationCanvas.height)
        rotCtx.save()
        rotCtx.translate(rotationCanvas.width / 2, rotationCanvas.height / 2)
        rotCtx.rotate(Math.PI / 2)
        rotCtx.drawImage(intermediateCanvas, -generateWidth / 2, -generateHeight / 2)
        rotCtx.restore()
      }
    }

    // For small barcodes, downscale from high DPI (288) to standard DPI (96) for consistency
    let finalCanvas = rotationCanvas
    if (isSmallBarcode) {
      const finalWidth = configuration.dimensions.unit === "cm"
        ? Math.round((configuration.dimensions.width / 2.54) * 96)
        : Math.round(configuration.dimensions.width * 96)
      const finalHeight = configuration.dimensions.unit === "cm"
        ? Math.round((configuration.dimensions.height / 2.54) * 96)
        : Math.round(configuration.dimensions.height * 96)

      finalCanvas = document.createElement("canvas")
      finalCanvas.width = isVertical ? finalHeight : finalWidth
      finalCanvas.height = isVertical ? finalWidth : finalHeight

      const finalCtx = finalCanvas.getContext("2d")
      if (finalCtx) {
        finalCtx.imageSmoothingEnabled = true
        finalCtx.imageSmoothingQuality = 'high'
        finalCtx.drawImage(rotationCanvas, 0, 0, finalCanvas.width, finalCanvas.height)
      }
    }

    // Convert canvas to data URL
    const dataUrl = finalCanvas.toDataURL("image/png")

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
