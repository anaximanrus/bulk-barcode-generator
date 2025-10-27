"use client"

import { useEffect, useRef, useState } from "react"
import JsBarcode from "jsbarcode"
import { QRCodeSVG } from "qrcode.react"
import type { BarcodeConfig, Dimensions, FontConfig } from "@/types/barcode"

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
}

function SingleBarcodePreview({ config, dimensions, label, sampleData, fontConfig }: SinglePreviewProps) {
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

  useEffect(() => {
    if (config.type === "qr") {
      setError("")
      return
    }

    if (!canvasRef.current) return

    try {
      const canvas = canvasRef.current
      const width = convertToPixels(dimensions.width, dimensions.unit)
      const height = convertToPixels(dimensions.height, dimensions.unit)

      // Map barcode type to JsBarcode format
      const formatMap: Record<string, string> = {
        code128: "CODE128",
        ean13: "EAN13",
        ean8: "EAN8",
        upca: "UPC",
        code39: "CODE39",
      }

      const format = formatMap[config.type] || "CODE128"

      // Clear canvas
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, width, height)
      }

      // Generate barcode
      JsBarcode(canvas, sampleData, {
        format,
        width: config.options.stretch ? width / 100 : 2,
        height: config.options.stretch ? height * 0.7 : height * 0.5,
        displayValue: config.options.showText,
        text: sampleData,
        font: activeFont.family,
        fontSize: activeFont.size,
        textMargin: 8,
        margin: 10,
        background: "#ffffff",
        lineColor: "#000000",
      })

      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate preview")
      console.error("Barcode preview error:", err)
    }
  }, [config, dimensions, sampleData, activeFont])

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

      <div className="border-2 border-dashed rounded-lg p-6 bg-muted/30 flex items-center justify-center min-h-[200px]">
        {error ? (
          <div className="text-sm text-destructive text-center">
            <p className="font-medium">Preview Error</p>
            <p className="text-xs mt-1">{error}</p>
          </div>
        ) : config.type === "qr" ? (
          <div className="flex flex-col items-center gap-2">
            <QRCodeSVG
              value={sampleData}
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
                {sampleData}
              </p>
            )}
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            className="max-w-full h-auto"
            style={{ imageRendering: "crisp-edges" }}
          />
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Sample: {sampleData}
      </p>
    </div>
  )
}

export function BarcodePreview({ config, barcodeData }: BarcodePreviewProps) {
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
      {/* Data Source Info */}
      {hasInputData && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
          <span className="font-medium">Preview showing:</span>
          <span>First item from your data ({barcodeData.length} total)</span>
        </div>
      )}

      {/* Primary Preview */}
      <SingleBarcodePreview
        config={config}
        dimensions={config.dimensions}
        label="Primary Preview"
        sampleData={sampleData}
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
            />
          </div>
        </>
      )}
    </div>
  )
}
