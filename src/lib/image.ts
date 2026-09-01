export function fitWithin(w: number, h: number, max: number): { w: number; h: number } {
  if (w <= max && h <= max) return { w, h }
  const ratio = max / Math.max(w, h)
  return { w: Math.round(w * ratio), h: Math.round(h * ratio) }
}

export function centerCropSquare(w: number, h: number): { x: number; y: number; size: number } {
  const size = Math.min(w, h)
  return { x: Math.floor((w - size) / 2), y: Math.floor((h - size) / 2), size }
}

type DrawSpec = { sx: number; sy: number; sw: number; sh: number; dw: number; dh: number }

function drawToJpeg(bitmap: ImageBitmap, spec: DrawSpec, quality: number): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = spec.dw
  canvas.height = spec.dh
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.reject(new Error('canvas 2d indisponível'))
  ctx.drawImage(bitmap, spec.sx, spec.sy, spec.sw, spec.sh, 0, 0, spec.dw, spec.dh)
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('toBlob falhou'))),
      'image/jpeg',
      quality,
    )
  })
}

/** Spec §13: ≤1080px JPEG q0.8 plus a 96px center-cropped thumb q0.7. Rejects on undecodable input. */
export async function processPhoto(file: Blob): Promise<{ photo: Blob; thumb: Blob }> {
  const bitmap = await createImageBitmap(file)
  try {
    const { w, h } = fitWithin(bitmap.width, bitmap.height, 1080)
    const photo = await drawToJpeg(
      bitmap,
      { sx: 0, sy: 0, sw: bitmap.width, sh: bitmap.height, dw: w, dh: h },
      0.8,
    )
    const crop = centerCropSquare(bitmap.width, bitmap.height)
    const thumb = await drawToJpeg(
      bitmap,
      { sx: crop.x, sy: crop.y, sw: crop.size, sh: crop.size, dw: 96, dh: 96 },
      0.7,
    )
    return { photo, thumb }
  } finally {
    bitmap.close()
  }
}
