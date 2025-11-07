export type BarcodeType = "code128" | "qr" | "ean13" | "ean8" | "upca" | "code39"

export type UnitType = "cm" | "inches"

export type OrientationType = "horizontal" | "vertical"

export interface Dimensions {
  width: number
  height: number
  unit: UnitType
}

export interface FontConfig {
  family: string
  size: number
  autoAdjustFont?: boolean
}

export interface IgnoreDigits {
  enabled: boolean
  position: "start" | "end"
  count: number
}

export interface BarcodeOptions {
  showText: boolean
  stretch: boolean
  ignoreDigits?: IgnoreDigits
}

export interface BarcodeConfig {
  type: BarcodeType
  dimensions: Dimensions
  font: FontConfig
  options: BarcodeOptions
  dualMode: boolean
  dualDimensions?: Dimensions
  dualFont?: FontConfig
  orientation?: OrientationType
  continuousMode?: boolean
}
