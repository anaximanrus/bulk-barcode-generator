import { z } from 'zod'

export const barcodeTypeSchema = z.enum(['code128', 'qr', 'ean13', 'ean8', 'upca', 'code39'])

export const dimensionsSchema = z.object({
  width: z.number().min(0.1).max(50),
  height: z.number().min(0.1).max(50),
  unit: z.enum(['cm', 'inches']),
})

export const fontConfigSchema = z.object({
  family: z.string().min(1),
  size: z.number().min(8).max(48),
})

export const ignoreDigitsSchema = z.object({
  enabled: z.boolean(),
  position: z.enum(['start', 'end']),
  count: z.number().min(1).max(20),
})

export const barcodeOptionsSchema = z.object({
  showText: z.boolean(),
  stretch: z.boolean(),
  ignoreDigits: ignoreDigitsSchema.optional(),
})

export const barcodeConfigurationSchema = z.object({
  type: barcodeTypeSchema,
  dimensions: dimensionsSchema,
  font: fontConfigSchema,
  options: barcodeOptionsSchema,
  dualMode: z.boolean(),
  dualDimensions: dimensionsSchema.optional(),
})

export const generateBarcodeRequestSchema = z.object({
  data: z.array(z.string().min(1)).min(1).max(1000),
  configuration: barcodeConfigurationSchema,
})

export type BarcodeType = z.infer<typeof barcodeTypeSchema>
export type Dimensions = z.infer<typeof dimensionsSchema>
export type FontConfig = z.infer<typeof fontConfigSchema>
export type BarcodeOptionsConfig = z.infer<typeof barcodeOptionsSchema>
export type BarcodeConfiguration = z.infer<typeof barcodeConfigurationSchema>
export type GenerateBarcodeRequest = z.infer<typeof generateBarcodeRequestSchema>
