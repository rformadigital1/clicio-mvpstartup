"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Booking, BookingStatus } from "@/lib/types"

const statusColors: Record<BookingStatus, string> = {
  reserved: "bg-blue-100 text-blue-800",
  waiting: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-orange-100 text-orange-800",
  ready: "bg-green-100 text-green-800",
  delivered: "bg-gray-100 text-gray-800",
}

const statusLabels: Record<BookingStatus, string> = {
  reserved: "Reservado",
  waiting: "Esperando",
  in_progress: "En progreso",
  ready: "Listo",
  delivered: "Entregado",
}

export default function BookingsPage() {
  const supabase = createClient()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [tenantId, setTenantId] = useState<string | null>(null)

  useEffect(() => {
    loadBookings()
  }, [])

  async function loadBookings() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single()

    if (!profile) return
    setTenantId(profile.tenant_id)

    const { data } = await supabase
      .from("bookings")
      .select("*, customers(*), services(*)")
      .eq("tenant_id", profile.tenant_id)
      .order("booking_date", { ascending: true })
      .order("booking_time", { ascending: true })

    setBookings(data ?? [])
  }

  async function updateStatus(bookingId: string, status: BookingStatus) {
    await supabase.from("bookings").update({ status }).eq("id", bookingId)
    loadBookings()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Agenda del día</h1>
      </div>

      <div className="space-y-3">
        {bookings.map((booking) => (
          <Card key={booking.id}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="text-right min-w-[60px]">
                <p className="font-medium">{booking.booking_time?.slice(0, 5)}</p>
              </div>
              <div className="flex-1">
                <p className="font-medium">{booking.customers?.name}</p>
                <p className="text-sm text-muted-foreground">{booking.customers?.plate} - {booking.services?.name}</p>
              </div>
              <Badge className={statusColors[booking.status as BookingStatus]}>
                {statusLabels[booking.status as BookingStatus]}
              </Badge>
              <Select
                value={booking.status}
                onValueChange={(val: BookingStatus) => updateStatus(booking.id, val)}
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        ))}
        {bookings.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No hay reservas</p>
        )}
      </div>
    </div>
  )
}
