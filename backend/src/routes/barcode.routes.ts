import { Router } from 'express'
import type { Request, Response } from 'express'
import { generateBarcodes } from '../services/barcodeGenerator.js'
import type { BarcodeOptions } from '../services/barcodeGenerator.js'
import { createZipStream } from '../utils/zipGenerator.js'
import { validateRequest } from '../middleware/validate.js'
import { generateBarcodeRequestSchema } from '../schemas/barcodeRequest.schema.js'
import type { GenerateBarcodeRequest } from '../schemas/barcodeRequest.schema.js'

export const barcodeRouter = Router()

/**
 * POST /api/barcode/generate
 * Generate barcodes and return as ZIP file
 */
barcodeRouter.post(
  '/generate',
  validateRequest(generateBarcodeRequestSchema),
  async (req: Request, res: Response) => {
    try {
      const { data, configuration } = req.body as GenerateBarcodeRequest

      console.log(`Generating ${data.length} barcodes...`)

      // Convert configuration to BarcodeOptions
      const options: BarcodeOptions = {
        type: configuration.type,
        width: configuration.dimensions.width,
        height: configuration.dimensions.height,
        unit: configuration.dimensions.unit,
        showText: configuration.options.showText,
        stretch: configuration.options.stretch,
        fontFamily: configuration.font.family,
        fontSize: configuration.font.size,
        ignoreDigits: configuration.options.ignoreDigits,
      }

      // Prepare dual mode options if enabled
      let dualOptions: BarcodeOptions | undefined
      if (configuration.dualMode && configuration.dualDimensions) {
        dualOptions = {
          ...options,
          width: configuration.dualDimensions.width,
          height: configuration.dualDimensions.height,
          unit: configuration.dualDimensions.unit,
        }
      }

      // Generate all barcodes
      const barcodes = await generateBarcodes(
        data,
        options,
        configuration.dualMode,
        dualOptions
      )

      console.log(`Generated ${barcodes.length} barcodes successfully`)

      // Create ZIP and stream to response
      const zipFilename = `barcodes_${Date.now()}.zip`
      await createZipStream(barcodes, res, zipFilename)
    } catch (error) {
      console.error('Error in barcode generation endpoint:', error)

      // Check if headers already sent
      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          error: 'Failed to generate barcodes',
          message: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }
  }
)
