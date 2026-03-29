import { FolderSetup } from './components/FolderSetup'
import { ImageGrid } from './components/ImageGrid'
import { useSettings } from './hooks/useSettings'

export default function App() {
  const { folderPath, setFolderPath, loading } = useSettings()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-neutral-400">
        読み込み中...
      </div>
    )
  }

  if (!folderPath) {
    return <FolderSetup onSelect={setFolderPath} />
  }

  return <ImageGrid folderPath={folderPath} onChangeFolder={setFolderPath} />
}
