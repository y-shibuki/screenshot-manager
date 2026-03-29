import type { ImageFile } from '@/types'

export async function getSetting(key: string): Promise<string | null> {
  const res = await fetch(`/api/settings/${key}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`GET /api/settings/${key} failed: ${res.status}`)
  const data = await res.json()
  return data.value as string
}

export async function putSetting(key: string, value: string): Promise<void> {
  const res = await fetch(`/api/settings/${key}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value }),
  })
  if (!res.ok) throw new Error(`PUT /api/settings/${key} failed: ${res.status}`)
}

export async function listImages(folderPath: string): Promise<ImageFile[]> {
  const res = await fetch(`/api/images?folder_path=${encodeURIComponent(folderPath)}`)
  if (!res.ok) throw new Error(`GET /api/images failed: ${res.status}`)
  const data = await res.json()
  return data.images as ImageFile[]
}

export async function deleteImage(path: string): Promise<void> {
  const res = await fetch('/api/images', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path }),
  })
  if (!res.ok) throw new Error(`DELETE /api/images failed: ${res.status}`)
}
