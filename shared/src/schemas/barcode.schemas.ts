import { z } from 'zod'

export const barcodeTypeSchema = z.enum(['code128', 'qr', 'ean13', 'ean8', 'upca', 'code39'])

export const unitTypeSchema = z.enum(['cm', 'inches'])

export const dimensionsSchema = z.object({
  width: z.number().positive().min(0.1).max(50),
  height: z.number().positive().min(0.1).max(50),
  unit: unitTypeSchema,
})

export const fontConfigSchema = z.object({
  family: z.string().min(1),
  size: z.number().int().min(8).max(48),
})

export const barcodeConfigSchema = z.object({
  type: barcodeTypeSchema,
  dimensions: dimensionsSchema,
  font: fontConfigSchema,
  showText: z.boolean(),
  stretch: z.boolean(),
  dualMode: z.boolean(),
  dualDimensions: dimensionsSchema.optional(),
  maxBarcodeLimit: z.number().int().min(1).max(1000).optional(),
})

export const createBarcodeDataSchema = (maxLimit: number = 200) =>
  z.object({
    data: z.array(z.string().min(1)).min(1).max(maxLimit),
    config: barcodeConfigSchema,
  })

export const barcodeGenerationRequestSchema = createBarcodeDataSchema(1000) // Server-side max
