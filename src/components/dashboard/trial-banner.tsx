"use client"

import { useEffect, useState, useCallback } from "react"
import { X } from "lucide-react"

export function TrialBanner() {
  const [message, setMessage] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    fetch("/api/trial/notification")
      .then((r) => r.json())
      .then((data) => {
        if (data.show) setMessage(data.message)
      })
      .catch(() => {})
  }, [])

  const handleDismiss = useCallback(async () => {
    setDismissed(true)
    try {
      await fetch("/api/trial/notification/dismiss", { method: "POST" })
    } catch {}
  }, [])

  if (!message || dismissed) return null

  return (
    <div className="flex items-center justify-between gap-4 bg-indigo-50 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-indigo-900/30 px-4 py-2.5 text-sm text-indigo-700 dark:text-indigo-300">
      <p className="flex-1 text-center">{message}</p>
      <button
        onClick={handleDismiss}
        className="shrink-0 rounded p-0.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
        aria-label="Cerrar"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
