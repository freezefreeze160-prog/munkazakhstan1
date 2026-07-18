// Client-side image downscaling. Resizes an image so its longest side is at
// most `maxDim` px and re-encodes it as JPEG. Returns the original file
// untouched if it's already small enough or if resizing isn't possible
// (e.g. a format the browser can't decode into a canvas).
export async function resizeImage(file: File, maxDim = 1200, quality = 0.82): Promise<Blob> {
  // Only attempt to resize raster images.
  if (!file.type.startsWith("image/")) return file

  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error("read failed"))
      reader.readAsDataURL(file)
    })

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error("decode failed"))
      image.src = dataUrl
    })

    const { naturalWidth: w, naturalHeight: h } = img
    if (!w || !h) return file
    // Already within bounds — keep the original file.
    if (w <= maxDim && h <= maxDim) return file

    const scale = maxDim / Math.max(w, h)
    const canvas = document.createElement("canvas")
    canvas.width = Math.round(w * scale)
    canvas.height = Math.round(h * scale)
    const ctx = canvas.getContext("2d")
    if (!ctx) return file
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", quality),
    )
    // Fall back to the original if compression somehow made it larger or failed.
    if (!blob || blob.size >= file.size) return file
    return blob
  } catch {
    return file
  }
}
