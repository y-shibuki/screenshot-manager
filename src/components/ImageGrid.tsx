import { useEffect, useState } from 'react'
import { Check, FolderOpen, Grip, Grid3X3, LayoutGrid, RefreshCw, Trash2, X } from 'lucide-react'
import { ImageCard } from './ImageCard'
import { ImagePreview } from './ImagePreview'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
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
  const [gridSize, setGridSize] = useState<'large' | 'medium' | 'small'>('medium')
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set())
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null)
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)

  const isSelectMode = selectedPaths.size > 0

  const gridCols = {
    large: 'grid-cols-3',
    medium: 'grid-cols-5',
    small: 'grid-cols-8',
  }[gridSize]

  useEffect(() => {
    refresh()
  }, [refresh])

  const handleCardClick = (image: ImageFile, index: number, e: React.MouseEvent) => {
    if (e.shiftKey) {
      e.preventDefault()
      if (lastSelectedIndex !== null && selectedPaths.size > 0) {
        const start = Math.min(lastSelectedIndex, index)
        const end = Math.max(lastSelectedIndex, index)
        const newSelected = new Set(selectedPaths)
        for (let i = start; i <= end; i++) {
          newSelected.add(images[i].path)
        }
        setSelectedPaths(newSelected)
      } else {
        setSelectedPaths(new Set([image.path]))
      }
      setLastSelectedIndex(index)
    } else if (isSelectMode) {
      const newSelected = new Set(selectedPaths)
      if (newSelected.has(image.path)) {
        newSelected.delete(image.path)
      } else {
        newSelected.add(image.path)
        setLastSelectedIndex(index)
      }
      setSelectedPaths(newSelected)
    } else {
      setPreviewIndex(index)
    }
  }

  const handleBulkDelete = async () => {
    for (const path of [...selectedPaths]) {
      await deleteImage(path)
    }
    setSelectedPaths(new Set())
    setLastSelectedIndex(null)
    setShowBulkDeleteConfirm(false)
  }

  const clearSelection = () => {
    setSelectedPaths(new Set())
    setLastSelectedIndex(null)
  }

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
        ) : isSelectMode ? (
          <>
            <span className="text-sm font-medium text-blue-600">{selectedPaths.size}件選択中</span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowBulkDeleteConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                削除
              </button>
              <button
                onClick={clearSelection}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
                選択解除
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 text-sm text-neutral-500 truncate min-w-0">
              <FolderOpen className="w-4 h-4 shrink-0" />
              <span className="truncate">{folderPath}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm text-neutral-400">{images.length}件</span>
              <div className="flex items-center border border-neutral-200 rounded-md overflow-hidden">
                {([
                  { size: 'large', icon: LayoutGrid, title: '大' },
                  { size: 'medium', icon: Grid3X3, title: '中' },
                  { size: 'small', icon: Grip, title: '小' },
                ] as const).map(({ size, icon: Icon, title }) => (
                  <button
                    key={size}
                    onClick={() => setGridSize(size)}
                    title={title}
                    className={`p-1.5 transition-colors ${gridSize === size ? 'bg-neutral-800 text-white' : 'hover:bg-neutral-100 text-neutral-600'}`}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
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
        <div className={`grid ${gridCols} gap-3`}>
          {images.map((image: ImageFile, index: number) => (
            <ImageCard
              key={image.path}
              image={image}
              isSelected={selectedPaths.has(image.path)}
              isSelectMode={isSelectMode}
              onDelete={deleteImage}
              onClick={(img, e) => handleCardClick(img, index, e)}
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
          onDelete={async (path) => {
            const len = images.length
            await deleteImage(path)
            if (len === 1) {
              setPreviewIndex(null)
            } else if (previewIndex >= len - 1) {
              setPreviewIndex(len - 2)
            }
          }}
        />
      )}

      {showBulkDeleteConfirm && (
        <DeleteConfirmDialog
          fileName={`${selectedPaths.size}件の画像`}
          onConfirm={handleBulkDelete}
          onCancel={() => setShowBulkDeleteConfirm(false)}
        />
      )}
    </div>
  )
}
