import JSZip from "jszip"

export interface BarcodeFile {
  dataUrl: string
  filename: string
}

/**
 * Convert data URL to Blob
 */
const dataURLtoBlob = (dataUrl: string): Blob => {
  const arr = dataUrl.split(",")
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png"
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new Blob([u8arr], { type: mime })
}

/**
 * Generate ZIP file with barcodes
 */
export const generateZipFile = async (barcodeFiles: BarcodeFile[]): Promise<Blob> => {
  const zip = new JSZip()

  // Add each barcode to the ZIP
  for (const file of barcodeFiles) {
    const blob = dataURLtoBlob(file.dataUrl)
    zip.file(file.filename, blob)
  }

  // Generate ZIP blob
  const zipBlob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: {
      level: 6,
    },
  })

  return zipBlob
}

/**
 * Download ZIP file
 */
export const downloadZipFile = (blob: Blob, filename = "barcodes.zip"): void => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Generate and download barcodes as ZIP
 */
export const downloadBarcodes = async (
  barcodeFiles: BarcodeFile[],
  zipFilename = "barcodes.zip"
): Promise<void> => {
  try {
    const zipBlob = await generateZipFile(barcodeFiles)
    downloadZipFile(zipBlob, zipFilename)
  } catch (error) {
    console.error("Error generating ZIP file:", error)
    throw new Error("Failed to generate ZIP file")
  }
}
