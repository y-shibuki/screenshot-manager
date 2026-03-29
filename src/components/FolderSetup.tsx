import { useState } from 'react'
import { FolderOpen } from 'lucide-react'

type Props = {
  onSelect: (path: string) => void
}

export function FolderSetup({ onSelect }: Props) {
  const [path, setPath] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (path.trim()) onSelect(path.trim())
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-6 text-center">
      <FolderOpen className="w-16 h-16 text-neutral-400" />
      <div>
        <h1 className="text-2xl font-semibold mb-2">フォルダを設定してください</h1>
        <p className="text-neutral-500 text-sm">
          スクリーンショットが保存されているフォルダのパスを入力します
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-lg px-4">
        <input
          type="text"
          value={path}
          onChange={(e) => setPath(e.target.value)}
          placeholder="/mnt/c/Users/username/OneDrive/スクリーンショット"
          className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
        />
        <button
          type="submit"
          disabled={!path.trim()}
          className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-700 disabled:opacity-50 transition-colors text-sm"
        >
          設定
        </button>
      </form>
    </div>
  )
}
