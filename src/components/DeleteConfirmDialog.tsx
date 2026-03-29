type Props = {
  fileName: string
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteConfirmDialog({ fileName, onConfirm, onCancel }: Props) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-lg p-6 shadow-xl max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold mb-2">ゴミ箱に移動</h3>
        <p className="text-sm text-neutral-600 mb-6 break-all">「{fileName}」をゴミ箱に移動しますか？</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm rounded-md hover:bg-neutral-100"
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md"
          >
            削除
          </button>
        </div>
      </div>
    </div>
  )
}
