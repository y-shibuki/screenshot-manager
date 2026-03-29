import { useEffect, useState } from 'react'
import { Check, FolderOpen, RefreshCw, X } from 'lucide-react'
import { ImageCard } from './ImageCard'
import { ImagePreview } from './ImagePreview'
import { useImages } from '@/hooks/useImages'
import type { ImageFile } from '@/types'

type Props = {
  folderPath: string
  onChangeFolder: (path: string) => void
}

export function ImageGrid({ folderPath, onChangeFolder }: Props) {
  const { images, loading, error, refresh, deleteImage } = useImages(folderPath)
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const [editingPath, setEditingPath] = useState(false)
  const [newPath, setNewPath] = useState('')

  useEffect(() => {
    refresh()
  }, [refresh])

  const handleChangeFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newPath.trim()) {
      onChangeFolder(newPath.trim())
      setEditingPath(false)
      setNewPath('')
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 bg-white gap-2">
        {editingPath ? (
          <form onSubmit={handleChangeFolderSubmit} className="flex items-center gap-2 flex-1">
            <input
              type="text"
              value={newPath}
              onChange={(e) => setNewPath(e.target.value)}
              placeholder={folderPath}
              autoFocus
              className="flex-1 px-2 py-1 text-sm border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-neutral-400"
            />
            <button type="submit" className="p-1.5 hover:bg-neutral-100 rounded-md" title="確定">
              <Check className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setEditingPath(false)}
              className="p-1.5 hover:bg-neutral-100 rounded-md"
              title="キャンセル"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <>
            <div className="flex items-center gap-2 text-sm text-neutral-500 truncate min-w-0">
              <FolderOpen className="w-4 h-4 shrink-0" />
              <span className="truncate">{folderPath}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm text-neutral-400">{images.length}件</span>
              <button
                onClick={refresh}
                disabled={loading}
                className="p-1.5 hover:bg-neutral-100 rounded-md transition-colors"
                title="更新"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => { setNewPath(''); setEditingPath(true) }}
                className="px-3 py-1.5 text-sm bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors"
              >
                フォルダ変更
              </button>
            </div>
          </>
        )}
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        {error && (
          <div className="text-red-500 text-sm p-4 bg-red-50 rounded-lg">{error}</div>
        )}
        {!loading && images.length === 0 && !error && (
          <div className="text-center text-neutral-400 mt-20">画像が見つかりません</div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {images.map((image: ImageFile, index: number) => (
            <ImageCard
              key={image.path}
              image={image}
              onDelete={deleteImage}
              onClick={() => setPreviewIndex(index)}
            />
          ))}
        </div>
      </main>

      {previewIndex !== null && (
        <ImagePreview
          image={images[previewIndex]}
          onClose={() => setPreviewIndex(null)}
          onPrev={previewIndex > 0 ? () => setPreviewIndex((i) => (i ?? 1) - 1) : undefined}
          onNext={
            previewIndex < images.length - 1
              ? () => setPreviewIndex((i) => (i ?? -1) + 1)
              : undefined
          }
        />
      )}
    </div>
  )
}
