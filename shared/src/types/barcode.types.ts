export type BarcodeType = 'code128' | 'qr' | 'ean13' | 'ean8' | 'upca' | 'code39'

export type UnitType = 'cm' | 'inches'

export interface Dimensions {
  width: number
  height: number
  unit: UnitType
}

export interface FontConfig {
  family: string
  size: number
}

export interface BarcodeConfig {
  type: BarcodeType
  dimensions: Dimensions
  font: FontConfig
  showText: boolean
  stretch: boolean
  dualMode: boolean
  dualDimensions?: Dimensions
  maxBarcodeLimit?: number
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
