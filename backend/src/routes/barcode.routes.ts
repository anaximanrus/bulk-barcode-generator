import { Router } from 'express'
import type { Request, Response } from 'express'
import { generateBarcodes } from '../services/barcodeGenerator.js'
import type { BarcodeOptions } from '../services/barcodeGenerator.js'
import { createZipStream } from '../utils/zipGenerator.js'
import { generatePrintReadyPNG } from '../services/pngGenerator.js'
import { generatePrintReadyPDF } from '../services/pdfGenerator.js'
import { validateRequest } from '../middleware/validate.js'
import { generateBarcodeRequestSchema, generatePrintReadyRequestSchema } from '../schemas/barcodeRequest.schema.js'
import type { GenerateBarcodeRequest, GeneratePrintReadyRequest } from '../schemas/barcodeRequest.schema.js'
import type { BarcodeConfig } from '@barcode-generator/shared'

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
        autoAdjustFont: configuration.font.autoAdjustFont,
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
          fontFamily: configuration.dualFont?.family || configuration.font.family,
          fontSize: configuration.dualFont?.size || configuration.font.size,
          autoAdjustFont: configuration.dualFont?.autoAdjustFont ?? configuration.font.autoAdjustFont,
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

/**
 * POST /api/barcode/generate-pdf
 * Generate print-ready PNG with barcodes
 */
barcodeRouter.post(
  '/generate-pdf',
  validateRequest(generatePrintReadyRequestSchema),
  async (req: Request, res: Response) => {
    try {
      const { data, configuration, layoutConfig } = req.body as GeneratePrintReadyRequest

      console.log(`Generating print-ready PNG with ${data.length} barcodes...`)

      // Use configuration as BarcodeConfig directly (already validated by schema)
      const barcodeConfig: BarcodeConfig = configuration

      // Generate PNG
      const pngBuffer = await generatePrintReadyPNG(data, barcodeConfig, layoutConfig)

      // Set response headers
      const filename = `barcodes_print_ready_${Date.now()}.png`
      res.setHeader('Content-Type', 'image/png')
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      res.setHeader('Content-Length', pngBuffer.length.toString())

      // Send PNG buffer
      res.send(pngBuffer)

      console.log(`PNG generated successfully: ${filename} (${pngBuffer.length} bytes)`)
    } catch (error) {
      console.error('Error in PNG generation endpoint:', error)

      // Check if headers already sent
      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          error: 'Failed to generate PNG',
          message: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }
  }
)

/**
 * POST /api/barcode/generate-pdf-document
 * Generate print-ready PDF with barcodes
 */
barcodeRouter.post(
  '/generate-pdf-document',
  validateRequest(generatePrintReadyRequestSchema),
  async (req: Request, res: Response) => {
    try {
      const { data, configuration, layoutConfig } = req.body as GeneratePrintReadyRequest

      console.log(`Generating print-ready PDF with ${data.length} barcodes...`)

      // Use configuration as BarcodeConfig directly (already validated by schema)
      const barcodeConfig: BarcodeConfig = configuration

      // Generate PDF
      const pdfDoc = await generatePrintReadyPDF(data, barcodeConfig, layoutConfig)

      // Set response headers
      const filename = `barcodes_print_ready_${Date.now()}.pdf`
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

      // Pipe PDF to response
      pdfDoc.pipe(res)

      console.log(`PDF generated successfully: ${filename}`)
    } catch (error) {
      console.error('Error in PDF generation endpoint:', error)

      // Check if headers already sent
      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          error: 'Failed to generate PDF',
          message: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }
  }
)
