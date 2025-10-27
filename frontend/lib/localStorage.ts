import type { BarcodeConfig } from "@/types/barcode"

const MAX_LIMIT_KEY = "maxBarcodeLimit"
const CONFIG_KEY = "barcodeConfig"
const DEFAULT_MAX_LIMIT = 200

export const saveMaxLimit = (limit: number): void => {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(MAX_LIMIT_KEY, limit.toString())
    }
  } catch (error) {
    console.error("Failed to save max limit to localStorage:", error)
  }
}

export const loadMaxLimit = (): number => {
  try {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(MAX_LIMIT_KEY)
      if (stored) {
        const parsed = parseInt(stored, 10)
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 1000) {
          return parsed
        }
      }
    }
  } catch (error) {
    console.error("Failed to load max limit from localStorage:", error)
  }
  return DEFAULT_MAX_LIMIT
}

export const saveConfig = (config: BarcodeConfig): void => {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
    }
  } catch (error) {
    console.error("Failed to save config to localStorage:", error)
  }
}

export const loadConfig = (): BarcodeConfig | null => {
  try {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(CONFIG_KEY)
      if (stored) {
        return JSON.parse(stored) as BarcodeConfig
      }
    }
  } catch (error) {
    console.error("Failed to load config from localStorage:", error)
  }
  return null
}
