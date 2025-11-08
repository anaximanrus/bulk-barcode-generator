"use client"

import { useEffect, useRef, useState } from "react"
import JsBarcode from "jsbarcode"
import { QRCodeSVG } from "qrcode.react"
import type { BarcodeConfig, Dimensions, FontConfig } from "@/types/barcode"
import { Button } from "@/components/ui/button"

interface BarcodePreviewProps {
  config: BarcodeConfig
  barcodeData: string[]
}

interface SinglePreviewProps {
  config: BarcodeConfig
  dimensions: Dimensions
  label: string
  sampleData: string
  fontConfig?: FontConfig
  actualSize: boolean
}

function SingleBarcodePreview({ config, dimensions, label, sampleData, fontConfig, actualSize }: SinglePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState<string>("")

  // Use provided fontConfig or fall back to config.font
  const activeFont = fontConfig || config.font

  // Convert cm or inches to pixels for display (using 96 DPI)
  const convertToPixels = (value: number, unit: "cm" | "inches"): number => {
    const DPI = 96
    if (unit === "cm") {
      return Math.round((value / 2.54) * DPI)
    }
    return Math.round(value * DPI)
  }

  // Process data by removing ignored digits (same as backend)
  const processData = (data: string): string => {
    const ignoreDigits = config.options.ignoreDigits
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

  // Process the sample data
  const processedData = processData(sampleData)

  useEffect(() => {
    if (config.type === "qr") {
      setError("")
      return
    }

    if (!canvasRef.current) return

    try {
      const canvas = canvasRef.current

      // Calculate dimensions based on barcode size for variable DPI
      const heightCm = dimensions.unit === "cm"
        ? dimensions.height
        : dimensions.height * 2.54
      const isSmallBarcode = heightCm < 1

      // Use 3x DPI (288) for small barcodes to improve text sharpness
      const DPI = isSmallBarcode ? 288 : 96

      // Convert to pixels at appropriate DPI
      const width = dimensions.unit === "cm"
        ? Math.round((dimensions.width / 2.54) * DPI)
        : Math.round(dimensions.width * DPI)
      const height = dimensions.unit === "cm"
        ? Math.round((dimensions.height / 2.54) * DPI)
        : Math.round(dimensions.height * DPI)

      // Check if vertical orientation
      const isVertical = config.orientation === "vertical"

      // Use original dimensions for generation, then rotate
      const generateWidth = width
      const generateHeight = height

      // For small barcodes, adjust font for better readability
      const shouldAutoAdjust = activeFont.autoAdjustFont !== false
      const adjustedFontSize = isSmallBarcode && shouldAutoAdjust
        ? Math.max(activeFont.size * 0.7, 6)
        : activeFont.size

      // Map barcode type to JsBarcode format
      const formatMap: Record<string, string> = {
        code128: "CODE128",
        ean13: "EAN13",
        ean8: "EAN8",
        upca: "UPC",
        code39: "CODE39",
      }

      const format = formatMap[config.type] || "CODE128"

      // Create temporary canvas for JsBarcode generation
      const tempCanvas = document.createElement("canvas")

      // Generate barcode on temporary canvas
      // Use consistent height (90%) regardless of stretch mode - stretch only affects rendering
      JsBarcode(tempCanvas, processedData, {
        format,
        width: config.options.stretch ? generateWidth / 100 : 2,
        height: generateHeight * 0.9, // Always 90% of canvas height for consistent size
        displayValue: config.options.showText,
        text: processedData,
        font: activeFont.family,
        fontSize: adjustedFontSize, // Use adjusted font size for small barcodes
        textMargin: 8,
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
        if (config.options.stretch) {
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
        const finalWidth = dimensions.unit === "cm"
          ? Math.round((dimensions.width / 2.54) * 96)
          : Math.round(dimensions.width * 96)
        const finalHeight = dimensions.unit === "cm"
          ? Math.round((dimensions.height / 2.54) * 96)
          : Math.round(dimensions.height * 96)

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

      // Set our canvas to final dimensions and draw
      canvas.width = finalCanvas.width
      canvas.height = finalCanvas.height

      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(finalCanvas, 0, 0)
      }

      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate preview")
      console.error("Barcode preview error:", err)
    }
  }, [config, dimensions, sampleData, activeFont, processedData])

  const qrSize = Math.min(
    convertToPixels(dimensions.width, dimensions.unit),
    convertToPixels(dimensions.height, dimensions.unit)
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{label}</h3>
        <span className="text-xs text-muted-foreground">
          {dimensions.width} × {dimensions.height} {dimensions.unit}
        </span>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg ${actualSize ? "p-0" : "p-6"} bg-muted/30 flex items-center justify-center min-h-[200px]`}
        style={actualSize ? { overflow: "auto" } : undefined}
      >
        {error ? (
          <div className="text-sm text-destructive text-center">
            <p className="font-medium">Preview Error</p>
            <p className="text-xs mt-1">{error}</p>
          </div>
        ) : config.type === "qr" ? (
          <div
            className={`flex flex-col items-center gap-2 ${actualSize ? "border-2 border-primary" : ""}`}
            style={actualSize ? { padding: 0 } : undefined}
          >
            <QRCodeSVG
              value={processedData}
              size={qrSize}
              level="M"
              includeMargin={true}
            />
            {config.options.showText && (
              <p
                className="text-center"
                style={{
                  fontFamily: activeFont.family,
                  fontSize: `${activeFont.size}px`,
                }}
              >
                {processedData}
              </p>
            )}
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            className={actualSize ? "border-2 border-primary" : "max-w-full h-auto"}
            style={{ imageRendering: "crisp-edges" }}
          />
        )}
      </div>

      <div className="text-xs text-muted-foreground text-center space-y-1">
        {config.options.ignoreDigits?.enabled ? (
          <>
            <p>
              <span className="font-medium">Original:</span> {sampleData}
            </p>
            <p>
              <span className="font-medium">After Ignore Digits:</span> {processedData}
            </p>
          </>
        ) : (
          <p>Sample: {sampleData}</p>
        )}
      </div>
    </div>
  )
}

export function BarcodePreview({ config, barcodeData }: BarcodePreviewProps) {
  const [actualSize, setActualSize] = useState(false)

  // Get sample data from input or use defaults based on barcode type
  const getSampleData = () => {
    if (barcodeData.length > 0) {
      return barcodeData[0] // Use first item from input data
    }

    // Fallback defaults for each barcode type
    switch (config.type) {
      case "ean13":
        return "1234567890128"
      case "ean8":
        return "12345670"
      case "upca":
        return "123456789012"
      default:
        return "SAMPLE123"
    }
  }

  const sampleData = getSampleData()
  const hasInputData = barcodeData.length > 0

  return (
    <div className="space-y-6">
      {/* Data Source Info & Size Toggle */}
      <div className="flex items-center justify-between gap-4">
        {hasInputData && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
            <span className="font-medium">Preview showing:</span>
            <span>First item from your data ({barcodeData.length} total)</span>
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-muted-foreground">Preview Mode:</span>
          <div className="flex gap-1 border rounded-md p-1">
            <Button
              variant={!actualSize ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActualSize(false)}
              className="h-7 px-3 text-xs"
            >
              Fit to Container
            </Button>
            <Button
              variant={actualSize ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActualSize(true)}
              className="h-7 px-3 text-xs"
            >
              Actual Size
            </Button>
          </div>
        </div>
      </div>

      {/* Primary Preview */}
      <SingleBarcodePreview
        config={config}
        dimensions={config.dimensions}
        label="Primary Preview"
        sampleData={sampleData}
        actualSize={actualSize}
      />

      {/* Secondary Preview (Dual Mode) */}
      {config.dualMode && config.dualDimensions && (
        <>
          <div className="border-t pt-6">
            <SingleBarcodePreview
              config={config}
              dimensions={config.dualDimensions}
              label="Secondary Preview"
              sampleData={sampleData}
              fontConfig={config.dualFont}
              actualSize={actualSize}
            />
          </div>
        </>
      )}
    </div>
  )
}
