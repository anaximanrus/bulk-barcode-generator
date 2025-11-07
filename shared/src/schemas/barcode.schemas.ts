import { z } from 'zod'

export const barcodeTypeSchema = z.enum(['code128', 'qr', 'ean13', 'ean8', 'upca', 'code39'])

export const unitTypeSchema = z.enum(['cm', 'inches'])

export const orientationTypeSchema = z.enum(['horizontal', 'vertical'])

export const dimensionsSchema = z.object({
  width: z.number().positive().min(0.1).max(50),
  height: z.number().positive().min(0.1).max(50),
  unit: unitTypeSchema,
})

export const fontConfigSchema = z.object({
  family: z.string().min(1),
  size: z.number().int().min(8).max(48),
  autoAdjustFont: z.boolean().optional(),
})

export const ignoreDigitsSchema = z.object({
  enabled: z.boolean(),
  position: z.enum(['start', 'end']),
  count: z.number().int().min(0).max(20),
})

export const barcodeOptionsSchema = z.object({
  showText: z.boolean(),
  stretch: z.boolean(),
  ignoreDigits: ignoreDigitsSchema.optional(),
})

export const barcodeConfigSchema = z.object({
  type: barcodeTypeSchema,
  dimensions: dimensionsSchema,
  font: fontConfigSchema,
  options: barcodeOptionsSchema,
  dualMode: z.boolean(),
  dualDimensions: dimensionsSchema.optional(),
  dualFont: fontConfigSchema.optional(),
  maxBarcodeLimit: z.number().int().min(1).max(1000).optional(),
  orientation: orientationTypeSchema.optional().default('horizontal'),
})

export const createBarcodeDataSchema = (maxLimit: number = 200) =>
  z.object({
    data: z.array(z.string().min(1)).min(1).max(maxLimit),
    config: barcodeConfigSchema,
  })

export const barcodeGenerationRequestSchema = createBarcodeDataSchema(1000) // Server-side max

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
  borderColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#FF0000'), // Red color
})

export const printReadyRequestSchema = z.object({
  data: z.array(z.string().min(1)).min(20).max(1000), // Server-side only, minimum 20 items
  config: barcodeConfigSchema,
  layoutConfig: printLayoutConfigSchema.partial().optional(),
})
