import { z } from 'zod'

export const barcodeTypeSchema = z.enum(['code128', 'qr', 'ean13', 'ean8', 'upca', 'code39'])

export const orientationTypeSchema = z.enum(['horizontal', 'vertical'])

export const dimensionsSchema = z.object({
  width: z.number().min(0.1).max(50),
  height: z.number().min(0.1).max(50),
  unit: z.enum(['cm', 'inches']),
})

export const fontConfigSchema = z.object({
  family: z.string().min(1),
  size: z.number().min(8).max(48),
  autoAdjustFont: z.boolean().optional(),
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
  dualFont: fontConfigSchema.optional(),
  orientation: orientationTypeSchema.optional().default('horizontal'),
})

export const generateBarcodeRequestSchema = z.object({
  data: z.array(z.string().min(1)).min(1).max(1000),
  configuration: barcodeConfigurationSchema,
})

export const printLayoutConfigSchema = z.object({
  canvasWidthCm: z.number().positive().default(100),
  continuousMode: z.boolean().optional().default(false),
  marginsMm: z.object({
    top: z.number().min(0).default(10),
    bottom: z.number().min(0).default(10),
    left: z.number().min(0).default(10),
    right: z.number().min(0).default(10),
  }).default({ top: 10, bottom: 10, left: 10, right: 10 }),
  spacingMm: z.number().min(0).default(5),
  borderWidthMm: z.number().positive().default(1),
  borderColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#FF0000'),
})

export const generatePrintReadyRequestSchema = z.object({
  data: z.array(z.string().min(1)).min(20).max(1000), // Server-side only, minimum 20 items
  configuration: barcodeConfigurationSchema,
  layoutConfig: printLayoutConfigSchema.partial().optional(),
})

export type BarcodeType = z.infer<typeof barcodeTypeSchema>
export type Dimensions = z.infer<typeof dimensionsSchema>
export type FontConfig = z.infer<typeof fontConfigSchema>
export type BarcodeOptionsConfig = z.infer<typeof barcodeOptionsSchema>
export type BarcodeConfiguration = z.infer<typeof barcodeConfigurationSchema>
export type GenerateBarcodeRequest = z.infer<typeof generateBarcodeRequestSchema>
export type PrintLayoutConfig = z.infer<typeof printLayoutConfigSchema>
export type GeneratePrintReadyRequest = z.infer<typeof generatePrintReadyRequestSchema>
