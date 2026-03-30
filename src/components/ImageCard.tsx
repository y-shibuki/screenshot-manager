import { useState } from 'react'
import { Check, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import type { ImageFile } from '@/types'

type Props = {
  image: ImageFile
  isSelected?: boolean
  isSelectMode?: boolean
  onDelete: (path: string) => void
  onClick: (image: ImageFile, e: React.MouseEvent) => void
}

export function ImageCard({ image, isSelected, isSelectMode, onDelete, onClick }: Props) {
  const [showActions, setShowActions] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowConfirm(true)
  }

  return (
    <div
      className={cn(
        'relative group cursor-pointer rounded-lg overflow-hidden bg-neutral-100',
        'border-2 transition-all',
        isSelected
          ? 'border-blue-500'
          : 'border-neutral-200 hover:border-neutral-400',
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={(e) => onClick(image, e)}
    >
      {isSelected && (
        <div className="absolute top-2 left-2 z-10 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
          <Check className="w-3 h-3 text-white" strokeWidth={3} />
        </div>
      )}
      <img
        src={image.thumb_url}
        alt={image.name}
        className={cn('w-full', isSelected && 'opacity-80')}
        loading="lazy"
      />
      <div className="px-2 py-1.5 text-xs text-neutral-600 truncate">{image.name}</div>
      {showActions && !isSelectMode && (
        <button
          onClick={handleDelete}
          className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-600 text-white rounded-md transition-colors"
          title="ゴミ箱に移動"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
      {showConfirm && (
        <DeleteConfirmDialog
          fileName={image.name}
          onConfirm={() => { setShowConfirm(false); onDelete(image.path) }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  )
}
