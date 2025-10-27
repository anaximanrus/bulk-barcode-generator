import type { BarcodeConfig } from "@/types/barcode"
import { checkAPIHealth } from "./apiClient"

export type GenerationMode = "client" | "server"

export interface RoutingDecision {
  mode: GenerationMode
  reason: string
  threshold: number
}

// Configuration
const CLIENT_SIDE_THRESHOLD = 20
const SERVER_FALLBACK_THRESHOLD = 100

/**
 * Determine whether to use client-side or server-side generation
 */
export const determineGenerationMode = async (
  dataCount: number,
  configuration: BarcodeConfig
): Promise<RoutingDecision> => {
  // Calculate complexity factor
  const complexityFactor = calculateComplexityFactor(configuration)
  const adjustedThreshold = Math.floor(CLIENT_SIDE_THRESHOLD / complexityFactor)

  // If data count is very small, always use client-side
  if (dataCount <= adjustedThreshold) {
    return {
      mode: "client",
      reason: `Small dataset (${dataCount} items). Client-side generation is faster.`,
      threshold: adjustedThreshold,
    }
  }

  // If data count is large, prefer server-side
  if (dataCount > SERVER_FALLBACK_THRESHOLD) {
    // Check if API is available
    const isAPIAvailable = await checkAPIHealth()
    if (isAPIAvailable) {
      return {
        mode: "server",
        reason: `Large dataset (${dataCount} items). Server-side generation is more efficient.`,
        threshold: adjustedThreshold,
      }
    } else {
      return {
        mode: "client",
        reason: `API unavailable. Falling back to client-side generation.`,
        threshold: adjustedThreshold,
      }
    }
  }

  // Medium-sized dataset: check API availability
  const isAPIAvailable = await checkAPIHealth()
  if (isAPIAvailable) {
    return {
      mode: "server",
      reason: `Medium dataset (${dataCount} items). Using server for better performance.`,
      threshold: adjustedThreshold,
    }
  }

  return {
    mode: "client",
    reason: `API unavailable. Using client-side generation.`,
    threshold: adjustedThreshold,
  }
}

/**
 * Calculate complexity factor based on configuration
 * Higher factor = more complex = lower threshold for server-side
 */
const calculateComplexityFactor = (configuration: BarcodeConfig): number => {
  let factor = 1

  // QR codes are more complex
  if (configuration.type === "qr") {
    factor *= 1.5
  }

  // Dual mode doubles the work
  if (configuration.dualMode) {
    factor *= 2
  }

  // Larger dimensions require more processing
  const avgDimension = (configuration.dimensions.width + configuration.dimensions.height) / 2
  if (avgDimension > 10) {
    factor *= 1.2
  }

  // Stretch mode adds processing overhead
  if (configuration.options.stretch) {
    factor *= 1.1
  }

  return Math.max(1, factor)
}

/**
 * Estimate generation time
 */
export const estimateGenerationTime = (
  dataCount: number,
  mode: GenerationMode,
  configuration: BarcodeConfig
): number => {
  const complexityFactor = calculateComplexityFactor(configuration)
  const baseTimePerBarcode = mode === "client" ? 50 : 30 // milliseconds

  const totalTime = dataCount * baseTimePerBarcode * complexityFactor

  // Add overhead
  const overhead = mode === "client" ? 500 : 1000 // network overhead for server

  return Math.round(totalTime + overhead)
}

/**
 * Format time estimate for display
 */
export const formatTimeEstimate = (milliseconds: number): string => {
  if (milliseconds < 1000) {
    return "Less than 1 second"
  }

  const seconds = Math.ceil(milliseconds / 1000)
  if (seconds < 60) {
    return `About ${seconds} second${seconds > 1 ? "s" : ""}`
  }

  const minutes = Math.ceil(seconds / 60)
  return `About ${minutes} minute${minutes > 1 ? "s" : ""}`
}
