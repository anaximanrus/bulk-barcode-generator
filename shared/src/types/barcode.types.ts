export type BarcodeType = 'code128' | 'qr' | 'ean13' | 'ean8' | 'upca' | 'code39'

export type UnitType = 'cm' | 'inches'

export type OrientationType = 'horizontal' | 'vertical'

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
  position: 'start' | 'end'
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
  maxBarcodeLimit?: number
  orientation?: OrientationType
}

export interface BarcodeData {
  value: string
}

export interface BarcodeGenerationRequest {
  data: string[]
  config: BarcodeConfig
}

export interface BarcodeFile {
  filename: string
  buffer: Buffer
}

export interface PrintLayoutConfig {
  canvasWidthCm: number // Fixed at 100cm (ignored when continuousMode=true)
  continuousMode?: boolean // Single-row continuous printing (for label rolls)
  marginsMm: {
    top: number
    bottom: number
    left: number
    right: number
  }
  spacingMm: number // Space between barcodes
  borderWidthMm: number // Red border width (1mm)
  borderColor: string // RGB color for border
}

export interface PrintReadyRequest {
  data: string[]
  config: BarcodeConfig
  layoutConfig?: Partial<PrintLayoutConfig> // Optional, uses defaults if not provided
}
