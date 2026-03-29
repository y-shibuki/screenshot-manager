import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ImageFile } from '@/types'

type Props = {
  image: ImageFile
  onDelete: (path: string) => void
  onClick: (image: ImageFile) => void
}

export function ImageCard({ image, onDelete, onClick }: Props) {
  const [showActions, setShowActions] = useState(false)

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(`「${image.name}」をゴミ箱に移動しますか？`)) {
      onDelete(image.path)
    }
  }

  return (
    <div
      className={cn(
        'relative group cursor-pointer rounded-lg overflow-hidden bg-neutral-100',
        'border border-neutral-200 hover:border-neutral-400 transition-all',
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={() => onClick(image)}
    >
      <div className="aspect-video w-full overflow-hidden">
        <img
          src={image.thumb_url}
          alt={image.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="px-2 py-1.5 text-xs text-neutral-600 truncate">{image.name}</div>
      {showActions && (
        <button
          onClick={handleDelete}
          className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-600 text-white rounded-md transition-colors"
          title="ゴミ箱に移動"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
