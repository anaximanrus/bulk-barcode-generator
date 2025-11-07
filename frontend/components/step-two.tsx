"use client"

import { useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import type { BarcodeConfig } from "@/types/barcode"
import { saveConfig } from "@/lib/localStorage"
import { BarcodePreview } from "@/components/barcode-preview"

interface StepTwoProps {
  config: BarcodeConfig
  setConfig: (config: BarcodeConfig) => void
  barcodeData: string[]
}

const barcodeTypes = [
  { value: "code128", label: "Code 128", description: "General purpose, alphanumeric" },
  { value: "qr", label: "QR Code", description: "2D code, large data capacity" },
  { value: "ean13", label: "EAN-13", description: "13 digits, retail products" },
  { value: "ean8", label: "EAN-8", description: "8 digits, small products" },
  { value: "upca", label: "UPC-A", description: "12 digits, North America" },
  { value: "code39", label: "Code 39", description: "Alphanumeric, logistics" },
]

const fontFamilies = ["Roboto", "Open Sans", "Lato", "Montserrat", "Courier Prime"]

export function StepTwo({ config, setConfig, barcodeData }: StepTwoProps) {
  const selectedType = barcodeTypes.find((t) => t.value === config.type)

  // Save config to localStorage whenever it changes
  useEffect(() => {
    saveConfig(config)
  }, [config])

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-start gap-4">
        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm flex-shrink-0">
          2
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold">Configure barcode settings</h2>
          <p className="text-sm text-muted-foreground">Customize type, dimensions, and appearance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Card */}
        <Card>
          <CardContent className="p-6 space-y-6">
            {/* Barcode Type */}
            <div className="space-y-2">
              <Label htmlFor="barcode-type">Barcode Type</Label>
              <Select value={config.type} onValueChange={(value) => setConfig({ ...config, type: value as any })}>
                <SelectTrigger id="barcode-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {barcodeTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedType && <p className="text-xs text-muted-foreground">{selectedType.description}</p>}
            </div>

            {/* Orientation */}
            <div className="space-y-2">
              <Label>Orientation</Label>
              <div className="flex border rounded-lg overflow-hidden">
                {(["horizontal", "vertical"] as const).map((orientation) => (
                  <button
                    key={orientation}
                    onClick={() => setConfig({ ...config, orientation })}
                    className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                      (config.orientation || "horizontal") === orientation
                        ? "bg-primary text-primary-foreground"
                        : "bg-background hover:bg-muted"
                    }`}
                  >
                    {orientation === "horizontal" ? "Horizontal" : "Vertical"}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {(config.orientation || "horizontal") === "horizontal"
                  ? "Standard layout (barcode reads left to right)"
                  : "Portrait layout (barcode rotated 90° for vertical labels)"}
              </p>
            </div>

          {/* Primary Dimensions */}
          <div className="space-y-3">
            <Label>Primary Dimensions</Label>
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-2">
                <Label htmlFor="width" className="text-xs">
                  Width
                </Label>
                <Input
                  id="width"
                  type="number"
                  min={0.1}
                  max={50}
                  step={0.1}
                  value={config.dimensions.width}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      dimensions: {
                        ...config.dimensions,
                        width: Number(e.target.value),
                      },
                    })
                  }
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="height" className="text-xs">
                  Height
                </Label>
                <Input
                  id="height"
                  type="number"
                  min={0.1}
                  max={50}
                  step={0.1}
                  value={config.dimensions.height}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      dimensions: {
                        ...config.dimensions,
                        height: Number(e.target.value),
                      },
                    })
                  }
                />
              </div>
              <div className="flex border rounded-lg overflow-hidden">
                {(["cm", "inches"] as const).map((unit) => (
                  <button
                    key={unit}
                    onClick={() =>
                      setConfig({
                        ...config,
                        dimensions: {
                          ...config.dimensions,
                          unit,
                        },
                      })
                    }
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      config.dimensions.unit === unit
                        ? "bg-primary text-primary-foreground"
                        : "bg-background hover:bg-muted"
                    }`}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Font Settings */}
          <div className="space-y-3">
            <Label>Font Settings</Label>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="font-family" className="text-xs">
                  Font Family
                </Label>
                <Select
                  value={config.font.family}
                  onValueChange={(value) =>
                    setConfig({
                      ...config,
                      font: {
                        ...config.font,
                        family: value,
                      },
                    })
                  }
                >
                  <SelectTrigger id="font-family">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontFamilies.map((font) => (
                      <SelectItem key={font} value={font}>
                        {font}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="font-size" className="text-xs">
                  Font Size (px)
                </Label>
                <Input
                  id="font-size"
                  type="number"
                  min={8}
                  max={48}
                  value={config.font.size}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      font: {
                        ...config.font,
                        size: Number(e.target.value),
                      },
                    })
                  }
                />
              </div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg border">
              <p
                className="text-center"
                style={{
                  fontFamily: config.font.family,
                  fontSize: `${config.font.size}px`,
                }}
              >
                BAR12345678
              </p>
            </div>
            <div className="flex items-center justify-between pt-2">
              <div className="space-y-0.5">
                <Label htmlFor="auto-adjust-font" className="text-sm font-normal">
                  Auto-adjust font for small barcodes
                </Label>
                <p className="text-xs text-muted-foreground">Improves readability for barcodes &lt; 1cm height</p>
              </div>
              <Switch
                id="auto-adjust-font"
                checked={config.font.autoAdjustFont ?? true}
                onCheckedChange={(checked) =>
                  setConfig({
                    ...config,
                    font: {
                      ...config.font,
                      autoAdjustFont: checked,
                    },
                  })
                }
              />
            </div>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <Label>Options</Label>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-text" className="text-sm font-normal">
                    Show Text
                  </Label>
                  <p className="text-xs text-muted-foreground">Display barcode value below the image</p>
                </div>
                <Switch
                  id="show-text"
                  checked={config.options.showText}
                  onCheckedChange={(checked) =>
                    setConfig({
                      ...config,
                      options: {
                        ...config.options,
                        showText: checked,
                      },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="stretch" className="text-sm font-normal">
                    Stretch
                  </Label>
                  <p className="text-xs text-muted-foreground">Stretch barcode to fill exact dimensions</p>
                </div>
                <Switch
                  id="stretch"
                  checked={config.options.stretch}
                  onCheckedChange={(checked) =>
                    setConfig({
                      ...config,
                      options: {
                        ...config.options,
                        stretch: checked,
                      },
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Ignore Digits */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="ignore-digits" className="text-sm font-normal">
                  Ignore Digits
                </Label>
                <p className="text-xs text-muted-foreground">Remove digits from beginning or end</p>
              </div>
              <Switch
                id="ignore-digits"
                checked={config.options.ignoreDigits?.enabled || false}
                onCheckedChange={(checked) =>
                  setConfig({
                    ...config,
                    options: {
                      ...config.options,
                      ignoreDigits: {
                        enabled: checked,
                        position: config.options.ignoreDigits?.position || "start",
                        count: config.options.ignoreDigits?.count || 5,
                      },
                    },
                  })
                }
              />
            </div>

            {config.options.ignoreDigits?.enabled && (
              <div className="border-2 border-dashed rounded-lg p-4 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="ignore-position" className="text-xs">
                    Position
                  </Label>
                  <Select
                    value={config.options.ignoreDigits.position}
                    onValueChange={(value: "start" | "end") =>
                      setConfig({
                        ...config,
                        options: {
                          ...config.options,
                          ignoreDigits: {
                            ...config.options.ignoreDigits!,
                            position: value,
                          },
                        },
                      })
                    }
                  >
                    <SelectTrigger id="ignore-position">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="start">From Beginning</SelectItem>
                      <SelectItem value="end">From End</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ignore-count" className="text-xs">
                    Number of Digits
                  </Label>
                  <Input
                    id="ignore-count"
                    type="number"
                    min={1}
                    max={20}
                    value={config.options.ignoreDigits.count}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        options: {
                          ...config.options,
                          ignoreDigits: {
                            ...config.options.ignoreDigits!,
                            count: Number(e.target.value),
                          },
                        },
                      })
                    }
                  />
                </div>
                <div className="p-3 bg-muted/50 rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-1">Example:</p>
                  <p className="text-sm font-mono">
                    00000290522165318135 → 290522165318135
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Dual Barcode Mode */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dual-mode" className="text-sm font-normal">
                  Dual Barcode Mode
                </Label>
                <p className="text-xs text-muted-foreground">Generate 2 versions with different dimensions</p>
              </div>
              <Switch
                id="dual-mode"
                checked={config.dualMode}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setConfig({
                      ...config,
                      dualMode: true,
                      dualDimensions: {
                        width: 3,
                        height: 2,
                        unit: config.dimensions.unit,
                      },
                      dualFont: {
                        family: config.font.family,
                        size: config.font.size,
                        autoAdjustFont: true,
                      },
                    })
                  } else {
                    setConfig({
                      ...config,
                      dualMode: false,
                      dualDimensions: undefined,
                      dualFont: undefined,
                    })
                  }
                }}
              />
            </div>

            {config.dualMode && config.dualDimensions && (
              <Collapsible open={config.dualMode}>
                <CollapsibleContent>
                  <div className="border-2 border-dashed rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Secondary Dimensions</Label>
                      <p className="text-xs text-muted-foreground">Each barcode will generate 2 files</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="secondary-width" className="text-xs">
                          Width
                        </Label>
                        <Input
                          id="secondary-width"
                          type="number"
                          min={0.1}
                          max={50}
                          step={0.1}
                          value={config.dualDimensions.width}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              dualDimensions: {
                                ...config.dualDimensions!,
                                width: Number(e.target.value),
                              },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="secondary-height" className="text-xs">
                          Height
                        </Label>
                        <Input
                          id="secondary-height"
                          type="number"
                          min={0.1}
                          max={50}
                          step={0.1}
                          value={config.dualDimensions.height}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              dualDimensions: {
                                ...config.dualDimensions!,
                                height: Number(e.target.value),
                              },
                            })
                          }
                        />
                      </div>
                    </div>

                    {/* Secondary Font Settings */}
                    <div className="border-t pt-3 mt-3">
                      <Label className="text-sm">Secondary Font Settings</Label>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
                        <div className="space-y-2">
                          <Label htmlFor="secondary-font-family" className="text-xs">
                            Font Family
                          </Label>
                          <Select
                            value={config.dualFont?.family || config.font.family}
                            onValueChange={(value) =>
                              setConfig({
                                ...config,
                                dualFont: {
                                  ...config.dualFont!,
                                  family: value,
                                },
                              })
                            }
                          >
                            <SelectTrigger id="secondary-font-family">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {fontFamilies.map((font) => (
                                <SelectItem key={font} value={font}>
                                  {font}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="secondary-font-size" className="text-xs">
                            Font Size (px)
                          </Label>
                          <Input
                            id="secondary-font-size"
                            type="number"
                            min={8}
                            max={48}
                            value={config.dualFont?.size || config.font.size}
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                dualFont: {
                                  ...config.dualFont!,
                                  size: Number(e.target.value),
                                },
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg border mt-3">
                        <p
                          className="text-center"
                          style={{
                            fontFamily: config.dualFont?.family || config.font.family,
                            fontSize: `${config.dualFont?.size || config.font.size}px`,
                          }}
                        >
                          BAR12345678
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-3">
                        <div className="space-y-0.5">
                          <Label htmlFor="dual-auto-adjust-font" className="text-sm font-normal">
                            Auto-adjust font for small barcodes
                          </Label>
                          <p className="text-xs text-muted-foreground">Improves readability for barcodes &lt; 1cm height</p>
                        </div>
                        <Switch
                          id="dual-auto-adjust-font"
                          checked={config.dualFont?.autoAdjustFont ?? true}
                          onCheckedChange={(checked) =>
                            setConfig({
                              ...config,
                              dualFont: {
                                family: config.dualFont?.family || config.font.family,
                                size: config.dualFont?.size || config.font.size,
                                autoAdjustFont: checked,
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>

          {/* Continuous Mode */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="continuous-mode" className="text-sm font-normal">
                  Continuous Mode
                </Label>
                <p className="text-xs text-muted-foreground">Single row layout for label roll printing</p>
              </div>
              <Switch
                id="continuous-mode"
                checked={config.continuousMode || false}
                onCheckedChange={(checked) =>
                  setConfig({
                    ...config,
                    continuousMode: checked,
                  })
                }
              />
            </div>
            {config.continuousMode && (
              <div className="p-3 bg-muted/50 rounded-lg border">
                <p className="text-xs text-muted-foreground">
                  All barcodes will be arranged in a single horizontal row. Canvas width will be calculated automatically
                  based on barcode count. Perfect for continuous label roll printers.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview Card */}
      <Card className="lg:sticky lg:top-6 h-fit">
        <CardContent className="p-6">
          <BarcodePreview config={config} barcodeData={barcodeData} />
        </CardContent>
      </Card>
    </div>
    </div>
  )
}
