"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import BookingActions from "@/components/booking/booking-actions"
import { STATUS_LABELS, STATUS_BADGE_CLASSES } from "@/lib/booking-constants"
import type { BookingStatus, Customer } from "@/lib/types"
import { Phone, Car, Calendar } from "lucide-react"

export default function CustomerHistoryModal({
  customerId,
  open,
  onClose,
}: {
  customerId: string
  open: boolean
  onClose: () => void
}) {
  const supabase = createClient()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!open || !customerId) return
    loadData()
  }, [open, customerId])

  async function loadData() {
    setLoading(true)

    const { data: custData } = await supabase
      .from("customers")
      .select("*")
      .eq("id", customerId)
      .single()
    setCustomer(custData)

    const { data: bkData } = await supabase
      .from("bookings")
      .select("id, booking_date, booking_time, status, customers(name, phone), vehicles(plate, brand), booking_services(services(name, price))")
      .eq("customer_id", customerId)
      .order("booking_date", { ascending: false })
      .order("booking_time", { ascending: false })

    setBookings(bkData ?? [])
    setLoading(false)
  }

  function handleStatusChange() {
    loadData()
  }

  const totalSpent = bookings
    .filter((b: any) => b.status === "delivered")
    .reduce((sum: number, b: any) => {
      const svcs = b.booking_services ?? []
      return sum + svcs.reduce((s: number, bs: any) => s + (bs.services?.price ?? 0), 0)
    }, 0)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{customer?.name ?? "Historial del Cliente"}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {customer?.phone && (
                <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {customer.phone}</span>
              )}
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {bookings.length} servicios</span>
              <span className="flex items-center gap-1"><Car className="h-3 w-3" /> Total: ${totalSpent.toLocaleString("es-CL")}</span>
            </div>

            {bookings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Sin historial</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {bookings.map((b: any) => {
                  const svcNames = b.booking_services?.map((bs: any) => bs.services?.name).filter(Boolean).join(", ") ?? ""
                  const amount = b.booking_services?.reduce((s: number, bs: any) => s + (bs.services?.price ?? 0), 0) ?? 0
                  return (
                    <div key={b.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{b.booking_date} {b.booking_time?.slice(0, 5)}</span>
                        <Badge className={STATUS_BADGE_CLASSES[b.status as BookingStatus]}>
                          {STATUS_LABELS[b.status as BookingStatus]}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {svcNames && <span>{svcNames} · </span>}
                        <span>${amount.toLocaleString("es-CL")}</span>
                        {b.vehicles?.plate && <span> · {b.vehicles.plate}</span>}
                      </div>
                      <BookingActions bookingId={b.id} currentStatus={b.status} onStatusChange={handleStatusChange} />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
