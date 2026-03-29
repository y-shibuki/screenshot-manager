import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Trash2, X } from 'lucide-react'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import type { ImageFile } from '@/types'

type Props = {
  image: ImageFile
  onClose: () => void
  onPrev?: () => void
  onNext?: () => void
  onDelete?: (path: string) => void
}

export function ImagePreview({ image, onClose, onPrev, onNext, onDelete }: Props) {
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showConfirm) return
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev?.()
      if (e.key === 'ArrowRight') onNext?.()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, onPrev, onNext, showConfirm])

  const handleConfirmDelete = () => {
    setShowConfirm(false)
    onDelete?.(image.path)
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {onDelete && (
          <button
            className="p-2 text-white hover:text-red-400"
            onClick={(e) => { e.stopPropagation(); setShowConfirm(true) }}
            title="ゴミ箱に移動"
          >
            <Trash2 className="w-6 h-6" />
          </button>
        )}
        <button
          className="p-2 text-white hover:text-neutral-300"
          onClick={onClose}
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      {onPrev && (
        <button
          className="absolute left-4 p-2 text-white hover:text-neutral-300"
          onClick={(e) => { e.stopPropagation(); onPrev() }}
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}
      {onNext && (
        <button
          className="absolute right-4 p-2 text-white hover:text-neutral-300"
          onClick={(e) => { e.stopPropagation(); onNext() }}
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      )}
      <img
        src={image.full_url}
        alt={image.name}
        className="max-w-[90vw] max-h-[90vh] object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      <div className="absolute bottom-4 text-white text-sm opacity-70">{image.name}</div>
      {showConfirm && (
        <DeleteConfirmDialog
          fileName={image.name}
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  )
}
