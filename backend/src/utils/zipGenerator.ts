import archiver from 'archiver'
import type { Response } from 'express'
import type { GeneratedBarcode } from '../services/barcodeGenerator.js'

/**
 * Create a ZIP file with barcodes and stream to response
 */
export const createZipStream = (
  barcodes: GeneratedBarcode[],
  res: Response,
  zipFilename = 'barcodes.zip'
): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Set response headers
    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`)

    // Create archiver instance
    const archive = archiver('zip', {
      zlib: { level: 6 }, // Compression level
    })

    // Handle errors
    archive.on('error', (err) => {
      console.error('Archive error:', err)
      reject(err)
    })

    // Track progress
    archive.on('progress', (progress) => {
      console.log(`Archive progress: ${progress.entries.processed}/${progress.entries.total}`)
    })

    // Resolve when archive is finalized
    archive.on('end', () => {
      console.log('Archive finalized')
      resolve()
    })

    // Pipe archive to response
    archive.pipe(res)

    // Add each barcode to the archive
    for (const barcode of barcodes) {
      archive.append(barcode.buffer, { name: barcode.filename })
    }

    // Finalize the archive
    archive.finalize()
  })
}

/**
 * Calculate estimated ZIP size
 */
export const estimateZipSize = (barcodes: GeneratedBarcode[]): number => {
  const totalSize = barcodes.reduce((sum, barcode) => sum + barcode.buffer.length, 0)
  // Estimate compressed size (typically 70-80% of original)
  return Math.round(totalSize * 0.75)
}
