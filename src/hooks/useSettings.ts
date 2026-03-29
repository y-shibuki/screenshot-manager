import { useEffect, useState } from 'react'
import { getSetting, putSetting } from '@/lib/api'

export function useSettings() {
  const [folderPath, setFolderPathState] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSetting('folder_path')
      .then((value) => setFolderPathState(value))
      .finally(() => setLoading(false))
  }, [])

  const setFolderPath = async (path: string) => {
    await putSetting('folder_path', path)
    setFolderPathState(path)
  }

  return { folderPath, setFolderPath, loading }
}
