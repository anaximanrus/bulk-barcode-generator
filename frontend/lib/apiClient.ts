import type { BarcodeConfig } from "@/types/barcode"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

export interface GenerateBarcodeRequest {
  data: string[]
  configuration: BarcodeConfig
}

export interface PrintLayoutConfig {
  canvasWidthCm?: number
  continuousMode?: boolean
  marginsMm?: {
    top?: number
    bottom?: number
    left?: number
    right?: number
  }
  spacingMm?: number
  borderWidthMm?: number
  borderColor?: string
}

export interface GeneratePrintReadyRequest {
  data: string[]
  configuration: BarcodeConfig
  layoutConfig?: PrintLayoutConfig
}

/**
 * Generate barcodes using the backend API
 * Returns a Blob containing the ZIP file
 */
export const generateBarcodesAPI = async (
  request: GenerateBarcodeRequest,
  onProgress?: (progress: number) => void
): Promise<Blob> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/barcode/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `Server error: ${response.status}`)
    }

    // Get the total size from Content-Length header
    const contentLength = response.headers.get("Content-Length")
    const total = contentLength ? parseInt(contentLength, 10) : 0

    // Read the response body as a stream
    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error("Response body is not readable")
    }

    const chunks: Uint8Array[] = []
    let receivedLength = 0

    while (true) {
      const { done, value } = await reader.read()

      if (done) break

      chunks.push(value)
      receivedLength += value.length

      // Report progress
      if (total > 0 && onProgress) {
        const progress = (receivedLength / total) * 100
        onProgress(progress)
      }
    }

    // Combine chunks into single Uint8Array
    const chunksAll = new Uint8Array(receivedLength)
    let position = 0
    for (const chunk of chunks) {
      chunksAll.set(chunk, position)
      position += chunk.length
    }

    // Create blob from combined chunks
    return new Blob([chunksAll], { type: "application/zip" })
  } catch (error) {
    console.error("API error:", error)
    throw new Error(error instanceof Error ? error.message : "Failed to generate barcodes via API")
  }
}

/**
 * Generate print-ready PNG using the backend API
 * Returns a Blob containing the PNG file
 */
export const generatePrintReadyPNG = async (
  request: GeneratePrintReadyRequest,
  onProgress?: (progress: number) => void
): Promise<Blob> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/barcode/generate-pdf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `Server error: ${response.status}`)
    }

    // Get the total size from Content-Length header
    const contentLength = response.headers.get("Content-Length")
    const total = contentLength ? parseInt(contentLength, 10) : 0

    // Read the response body as a stream
    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error("Response body is not readable")
    }

    const chunks: Uint8Array[] = []
    let receivedLength = 0

    while (true) {
      const { done, value } = await reader.read()

      if (done) break

      chunks.push(value)
      receivedLength += value.length

      // Report progress
      if (total > 0 && onProgress) {
        const progress = (receivedLength / total) * 100
        onProgress(progress)
      }
    }

    // Combine chunks into single Uint8Array
    const chunksAll = new Uint8Array(receivedLength)
    let position = 0
    for (const chunk of chunks) {
      chunksAll.set(chunk, position)
      position += chunk.length
    }

    // Create blob from combined chunks
    return new Blob([chunksAll], { type: "image/png" })
  } catch (error) {
    console.error("API error:", error)
    throw new Error(error instanceof Error ? error.message : "Failed to generate print-ready PNG via API")
  }
}

/**
 * Generate print-ready PDF using the backend API
 * Returns a Blob containing the PDF file
 */
export const generatePrintReadyPDF = async (
  request: GeneratePrintReadyRequest,
  onProgress?: (progress: number) => void
): Promise<Blob> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/barcode/generate-pdf-document`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `Server error: ${response.status}`)
    }

    // Get the total size from Content-Length header
    const contentLength = response.headers.get("Content-Length")
    const total = contentLength ? parseInt(contentLength, 10) : 0

    // Read the response body as a stream
    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error("Response body is not readable")
    }

    const chunks: Uint8Array[] = []
    let receivedLength = 0

    while (true) {
      const { done, value } = await reader.read()

      if (done) break

      chunks.push(value)
      receivedLength += value.length

      // Report progress
      if (total > 0 && onProgress) {
        const progress = (receivedLength / total) * 100
        onProgress(progress)
      }
    }

    // Combine chunks into single Uint8Array
    const chunksAll = new Uint8Array(receivedLength)
    let position = 0
    for (const chunk of chunks) {
      chunksAll.set(chunk, position)
      position += chunk.length
    }

    // Create blob from combined chunks
    return new Blob([chunksAll], { type: "application/pdf" })
  } catch (error) {
    console.error("API error:", error)
    throw new Error(error instanceof Error ? error.message : "Failed to generate print-ready PDF via API")
  }
}

/**
 * Check if the backend API is available
 */
export const checkAPIHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(5000), // 5 second timeout
    })
    return response.ok
  } catch (error) {
    console.error("Health check failed:", error)
    return false
  }
}
