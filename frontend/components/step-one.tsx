"use client"

import { useState } from "react"
import { Upload, X } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface StepOneProps {
  barcodeData: string[]
  setBarcodeData: (data: string[]) => void
  maxLimit: number
  setMaxLimit: (limit: number) => void
}

export function StepOne({ barcodeData, setBarcodeData, maxLimit, setMaxLimit }: StepOneProps) {
  const [manualInput, setManualInput] = useState("")
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvPreview, setCsvPreview] = useState<string[]>([])
  const [startNumber, setStartNumber] = useState(1)
  const [endNumber, setEndNumber] = useState(100)
  const [prefix, setPrefix] = useState("")
  const [suffix, setSuffix] = useState("")
  const [tempMaxLimit, setTempMaxLimit] = useState(maxLimit)

  const handleManualInputChange = (value: string) => {
    setManualInput(value)
    const lines = value.split("\n").filter((line) => line.trim() !== "")
    setBarcodeData(lines)
  }

  const handleCsvUpload = async (file: File) => {
    setCsvFile(file)

    // Dynamically import PapaParse
    const Papa = (await import("papaparse")).default

    Papa.parse(file, {
      complete: (results) => {
        // Extract first column from all rows
        const lines = results.data
          .map((row: any) => (Array.isArray(row) ? row[0] : row))
          .filter((line: any) => line && String(line).trim() !== "")
          .map((line: any) => String(line).trim())

        setCsvPreview(lines.slice(0, 5))
        setBarcodeData(lines)
      },
      error: (error) => {
        console.error("CSV parsing error:", error)
        alert("Failed to parse CSV file. Please check the file format.")
      },
      skipEmptyLines: true,
    })
  }

  const handleSequentialGenerate = () => {
    const count = endNumber - startNumber + 1
    const generated = Array.from({ length: count }, (_, i) => {
      const num = (startNumber + i).toString().padStart(3, "0")
      return `${prefix}${num}${suffix}`
    })
    setBarcodeData(generated)
  }

  const clearAll = () => {
    setBarcodeData([])
    setManualInput("")
    setCsvFile(null)
    setCsvPreview([])
  }

  const isApproachingLimit = barcodeData.length > maxLimit * 0.9
  const isExceedingLimit = barcodeData.length > maxLimit

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-start gap-4">
        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm flex-shrink-0">
          1
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold">Enter barcode data</h2>
          <p className="text-sm text-muted-foreground">Choose your input method and add your data</p>
        </div>
      </div>

      {/* Tabs */}
      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="manual">Manual Input</TabsTrigger>
              <TabsTrigger value="csv">CSV Upload</TabsTrigger>
              <TabsTrigger value="sequential">Sequential Generator</TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  placeholder="Enter barcode data (one per line)&#10;&#10;Example:&#10;BAR001&#10;BAR002&#10;BAR003"
                  className="min-h-[300px] font-mono text-sm"
                  value={manualInput}
                  onChange={(e) => handleManualInputChange(e.target.value)}
                />
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm ${isExceedingLimit ? "text-destructive font-medium" : isApproachingLimit ? "text-orange-500 font-medium" : "text-muted-foreground"}`}
                  >
                    {barcodeData.length} / {maxLimit} barcodes
                  </span>
                  {isExceedingLimit && <span className="text-sm text-destructive">Exceeds maximum limit</span>}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="csv" className="space-y-4">
              <div
                className="border-2 border-dashed rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => document.getElementById("csv-upload")?.click()}
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">Drag & drop CSV file or click to browse</p>
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleCsvUpload(e.target.files[0])}
                />
              </div>

              {csvFile && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{csvFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(csvFile.size / 1024).toFixed(2)} KB • {barcodeData.length} rows
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setCsvFile(null)
                        setCsvPreview([])
                        setBarcodeData([])
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {csvPreview.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-muted/50 px-4 py-2 border-b">
                        <p className="text-sm font-medium">Preview (first 5 rows)</p>
                      </div>
                      <div className="divide-y">
                        {csvPreview.map((row, i) => (
                          <div key={i} className="px-4 py-2 text-sm font-mono">
                            {row}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="sequential" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-number">Start Number</Label>
                  <Input
                    id="start-number"
                    type="number"
                    value={startNumber}
                    onChange={(e) => setStartNumber(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-number">End Number</Label>
                  <Input
                    id="end-number"
                    type="number"
                    value={endNumber}
                    onChange={(e) => setEndNumber(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prefix">Prefix (optional)</Label>
                  <Input
                    id="prefix"
                    type="text"
                    placeholder="e.g., BAR"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="suffix">Suffix (optional)</Label>
                  <Input
                    id="suffix"
                    type="text"
                    placeholder="e.g., -2025"
                    value={suffix}
                    onChange={(e) => setSuffix(e.target.value)}
                  />
                </div>
              </div>

              <Button onClick={handleSequentialGenerate} className="w-full">
                Generate
              </Button>

              {endNumber >= startNumber && (
                <Alert>
                  <AlertDescription>
                    Will generate {endNumber - startNumber + 1} barcodes ({prefix}
                    {startNumber.toString().padStart(3, "0")}
                    {suffix} to {prefix}
                    {endNumber.toString().padStart(3, "0")}
                    {suffix})
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Data Preview and Max Limit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Current Data</CardTitle>
              <Badge variant="secondary">{barcodeData.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {barcodeData.length > 0 ? (
              <>
                <div className="max-h-[200px] overflow-y-auto space-y-1 mb-4">
                  {barcodeData.map((data, i) => (
                    <div key={i} className="text-sm font-mono px-3 py-1.5 bg-muted/50 rounded">
                      {data}
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={clearAll} className="w-full bg-transparent">
                  Clear All
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No data entered yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Maximum Limit</CardTitle>
            <CardDescription>Maximum barcodes that can be generated in one batch</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                type="number"
                min={1}
                max={1000}
                value={tempMaxLimit}
                onChange={(e) => setTempMaxLimit(Number(e.target.value))}
              />
            </div>
            <Button onClick={() => setMaxLimit(tempMaxLimit)} className="w-full" variant="secondary">
              Save
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
