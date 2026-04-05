"use client"

import { useCallback, useState } from "react"

export function useSaveStatus(savedDuration = 2000) {
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const wrap = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T> => {
      setIsSaving(true)
      const result = await fn()
      setIsSaving(false)
      setSaved(true)
      setTimeout(() => setSaved(false), savedDuration)
      return result
    },
    [savedDuration],
  )

  return { isSaving, saved, wrap }
}
