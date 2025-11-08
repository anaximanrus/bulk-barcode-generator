"use client"

import { useState, useEffect } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { StepOne } from "@/components/step-one"
import { StepTwo } from "@/components/step-two"
import { StepThree } from "@/components/step-three"
import type { BarcodeConfig } from "@/types/barcode"
import { loadMaxLimit, loadConfig } from "@/lib/localStorage"

export default function Home() {
  const { theme, setTheme } = useTheme()
  const [barcodeData, setBarcodeData] = useState<string[]>([])
  const [maxLimit, setMaxLimit] = useState(100)
  const [config, setConfig] = useState<BarcodeConfig>({
    type: "code128",
    dimensions: {
      width: 5,
      height: 3,
      unit: "cm",
    },
    font: {
      family: "Roboto",
      size: 12,
    },
    options: {
      showText: true,
      stretch: true,
      ignoreDigits: {
        enabled: false,
        position: "start",
        count: 5,
      },
    },
    dualMode: false,
    orientation: "horizontal",
    continuousMode: false,
  })

  // Load saved config and max limit from localStorage on mount
  useEffect(() => {
    const savedConfig = loadConfig()
    if (savedConfig) {
      setConfig(savedConfig)
    }

    const savedMaxLimit = loadMaxLimit()
    setMaxLimit(savedMaxLimit)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-balance">Bulk Barcode Generator</h1>
            <p className="text-sm text-muted-foreground mt-1">Generate professional barcodes in bulk</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        <StepOne
          barcodeData={barcodeData}
          setBarcodeData={setBarcodeData}
          maxLimit={maxLimit}
          setMaxLimit={setMaxLimit}
        />
        <StepTwo config={config} setConfig={setConfig} barcodeData={barcodeData} />
        <StepThree barcodeData={barcodeData} config={config} maxLimit={maxLimit} />
      </main>
    </div>
  )
}
