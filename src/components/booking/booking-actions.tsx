"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { STATUS_LABELS } from "@/lib/booking-constants"
import type { BookingStatus } from "@/lib/types"

const ORDER: BookingStatus[] = ["reserved", "waiting", "in_progress", "ready", "delivered", "cancelled"]

export default function BookingActions({
  bookingId,
  currentStatus,
  onStatusChange,
}: {
  bookingId: string
  currentStatus: BookingStatus
  onStatusChange?: (id: string, newStatus: BookingStatus) => void
}) {
  const [loadingStatus, setLoadingStatus] = useState<BookingStatus | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  async function handleChange(newStatus: BookingStatus) {
    if (newStatus === currentStatus || loadingStatus) return
    setLoadingStatus(newStatus)

    const { error } = await supabase
      .from("bookings")
      .update({ status: newStatus })
      .eq("id", bookingId)

    if (error) {
      toast({ title: "Error al cambiar estado", description: error.message, variant: "destructive" })
      setLoadingStatus(null)
      return
    }

    toast({ title: `Estado cambiado a ${STATUS_LABELS[newStatus].toLowerCase()}` })
    setLoadingStatus(null)
    onStatusChange?.(bookingId, newStatus)
  }

  return (
    <div className="flex flex-wrap gap-1">
      {ORDER.map((status) => (
        <Button
          key={status}
          size="sm"
          variant={status === currentStatus ? "default" : "outline"}
          onClick={() => handleChange(status)}
          disabled={loadingStatus !== null}
          className="text-[10px] h-7 px-2 min-w-0"
        >
          {loadingStatus === status ? "..." : STATUS_LABELS[status]}
        </Button>
      ))}
    </div>
  )
}
