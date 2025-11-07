"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Download, Loader2, CheckCircle2, AlertCircle, FileText } from "lucide-react"
import type { BarcodeConfig } from "@/types/barcode"
import { determineGenerationMode, estimateGenerationTime, formatTimeEstimate } from "@/lib/hybridRouting"
import { generateBarcodes } from "@/lib/barcodeGenerator"
import { downloadBarcodes } from "@/lib/zipGenerator"
import { generateBarcodesAPI, generatePrintReadyPNG, generatePrintReadyPDF, type PrintLayoutConfig } from "@/lib/apiClient"
import { downloadZipFile } from "@/lib/zipGenerator"

interface StepThreeProps {
  barcodeData: string[]
  config: BarcodeConfig
  maxLimit: number
}

export function StepThree({ barcodeData, config, maxLimit }: StepThreeProps) {
  const isReady = barcodeData.length > 0 && barcodeData.length <= maxLimit
  const count = barcodeData.length

  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<"idle" | "determining" | "generating" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [generationMode, setGenerationMode] = useState<"client" | "server" | null>(null)

  const getConfigSummary = () => {
    const parts = []
    parts.push(config.type.toUpperCase())
    parts.push(`${config.dimensions.width}×${config.dimensions.height}${config.dimensions.unit}`)
    if (config.dualMode && config.dualDimensions) parts.push("Dual Mode")
    return parts.join(" • ")
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    setStatus("determining")
    setProgress(0)
    setErrorMessage("")

    try {
      // Determine generation mode
      const decision = await determineGenerationMode(count, config)
      setGenerationMode(decision.mode)
      setStatus("generating")

      if (decision.mode === "client") {
        // Client-side generation
        const barcodes = await generateBarcodes(barcodeData, config)
        setProgress(75)

        // Download as ZIP
        await downloadBarcodes(barcodes, "barcodes.zip")
        setProgress(100)
        setStatus("success")
      } else {
        // Server-side generation
        const blob = await generateBarcodesAPI(
          {
            data: barcodeData,
            configuration: config,
          },
          (downloadProgress) => {
            setProgress(Math.min(95, downloadProgress))
          }
        )

        // Download the ZIP
        downloadZipFile(blob, "barcodes.zip")
        setProgress(100)
        setStatus("success")
      }

      // Auto-close after 2 seconds
      setTimeout(() => {
        setIsGenerating(false)
        setStatus("idle")
        setProgress(0)
      }, 2000)
    } catch (error) {
      console.error("Generation error:", error)
      setStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "Failed to generate barcodes")
    }
  }

  const handleGeneratePrintReady = async () => {
    setIsGenerating(true)
    setStatus("generating")
    setProgress(0)
    setErrorMessage("")
    setGenerationMode("server")

    try {
      // Prepare layout config with continuous mode from barcode config
      const layoutConfig: PrintLayoutConfig = {
        continuousMode: config.continuousMode,
      }

      // Generate print-ready PNG (server-side only)
      const blob = await generatePrintReadyPNG(
        {
          data: barcodeData,
          configuration: config,
          layoutConfig,
        },
        (downloadProgress) => {
          setProgress(Math.min(95, downloadProgress))
        }
      )

      // Download the PNG
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `barcodes_print_ready_${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setProgress(100)
      setStatus("success")

      // Auto-close after 2 seconds
      setTimeout(() => {
        setIsGenerating(false)
        setStatus("idle")
        setProgress(0)
      }, 2000)
    } catch (error) {
      console.error("PNG generation error:", error)
      setStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "Failed to generate print-ready PNG")
    }
  }

  const handleGeneratePrintReadyPDF = async () => {
    setIsGenerating(true)
    setStatus("generating")
    setProgress(0)
    setErrorMessage("")
    setGenerationMode("server")

    try {
      // Prepare layout config with continuous mode from barcode config
      const layoutConfig: PrintLayoutConfig = {
        continuousMode: config.continuousMode,
      }

      // Generate print-ready PDF (server-side only)
      const blob = await generatePrintReadyPDF(
        {
          data: barcodeData,
          configuration: config,
          layoutConfig,
        },
        (downloadProgress) => {
          setProgress(Math.min(95, downloadProgress))
        }
      )

      // Download the PDF
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `barcodes_print_ready_${Date.now()}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setProgress(100)
      setStatus("success")

      // Auto-close after 2 seconds
      setTimeout(() => {
        setIsGenerating(false)
        setStatus("idle")
        setProgress(0)
      }, 2000)
    } catch (error) {
      console.error("PDF generation error:", error)
      setStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "Failed to generate print-ready PDF")
    }
  }

  const closeModal = () => {
    setIsGenerating(false)
    setStatus("idle")
    setProgress(0)
    setErrorMessage("")
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-start gap-4">
        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm flex-shrink-0">
          3
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold">Generate barcodes</h2>
          <p className="text-sm text-muted-foreground">Download your barcodes as images</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="space-y-1">
              {isReady ? (
                <>
                  <p className="font-medium">
                    Ready to generate {count} barcode{count !== 1 ? "s" : ""}
                  </p>
                  <p className="text-sm text-muted-foreground">{getConfigSummary()}</p>
                </>
              ) : count === 0 ? (
                <p className="text-muted-foreground">No data entered yet</p>
              ) : (
                <p className="text-destructive">
                  Data exceeds maximum limit ({count} / {maxLimit})
                </p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
              <Button
                size="lg"
                disabled={!isReady}
                onClick={handleGenerate}
                className="w-full lg:w-auto lg:min-w-[200px]"
              >
                <Download className="h-4 w-4 mr-2" />
                {isReady ? `Generate ZIP` : "Cannot Generate"}
              </Button>
              {count >= 20 && (
                <>
                  <Button
                    size="lg"
                    variant="outline"
                    disabled={!isReady}
                    onClick={handleGeneratePrintReady}
                    className="w-full lg:w-auto lg:min-w-[200px]"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Print-Ready PNG
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    disabled={!isReady}
                    onClick={handleGeneratePrintReadyPDF}
                    className="w-full lg:w-auto lg:min-w-[200px]"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Print-Ready PDF
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generation Progress Dialog */}
      <Dialog open={isGenerating} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {status === "determining" && "Determining best method..."}
              {status === "generating" && `Generating ${count} barcodes`}
              {status === "success" && "Success!"}
              {status === "error" && "Error"}
            </DialogTitle>
            <DialogDescription>
              {status === "determining" && "Checking API availability and optimizing generation..."}
              {status === "generating" && generationMode === "server" &&
                "Generating print-ready PDF with barcodes..."}
              {status === "generating" && generationMode !== "server" &&
                `Using ${generationMode === "client" ? "client-side" : "server-side"} generation`}
              {status === "success" && "Your barcodes have been generated and downloaded."}
              {status === "error" && errorMessage}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {status === "error" ? (
              <div className="flex items-center justify-center py-8">
                <AlertCircle className="h-16 w-16 text-destructive" />
              </div>
            ) : status === "success" ? (
              <div className="flex items-center justify-center py-8">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-16 w-16 animate-spin text-primary" />
                </div>
                <div className="space-y-2">
                  <Progress value={progress} className="w-full" />
                  <p className="text-sm text-center text-muted-foreground">{Math.round(progress)}%</p>
                </div>
              </>
            )}
          </div>

          {status === "error" && (
            <Button onClick={closeModal} className="w-full">
              Close
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
