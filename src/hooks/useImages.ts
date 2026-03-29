import { useCallback, useState } from 'react'
import { deleteImage as apiDeleteImage, listImages } from '@/lib/api'
import type { ImageFile } from '@/types'

export function useImages(folderPath: string | null) {
  const [images, setImages] = useState<ImageFile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!folderPath) return
    setLoading(true)
    setError(null)
    try {
      const result = await listImages(folderPath)
      setImages(result)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [folderPath])

  const deleteImage = useCallback(async (path: string) => {
    await apiDeleteImage(path)
    setImages((prev) => prev.filter((img) => img.path !== path))
  }, [])

  return { images, loading, error, refresh, deleteImage }
}
