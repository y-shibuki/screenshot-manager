import { useEffect } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { ImageFile } from '@/types'

type Props = {
  image: ImageFile
  onClose: () => void
  onPrev?: () => void
  onNext?: () => void
}

export function ImagePreview({ image, onClose, onPrev, onNext }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev?.()
      if (e.key === 'ArrowRight') onNext?.()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, onPrev, onNext])

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 p-2 text-white hover:text-neutral-300"
        onClick={onClose}
      >
        <X className="w-6 h-6" />
      </button>
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
    </div>
  )
}
