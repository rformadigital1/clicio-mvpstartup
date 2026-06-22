"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Car, Calendar, Wrench } from "lucide-react"
import type { Vehicle, Booking, Service } from "@/lib/types"
import { STATUS_LABELS, STATUS_BADGE_CLASSES } from "@/lib/booking-constants"

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [vehicle, setVehicle] = useState<(Vehicle & { customers?: { name: string; phone: string } }) | null>(null)
  const [bookings, setBookings] = useState<(Booking & { services?: Service })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    loadData()
  }, [id])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single()
    if (!profile) return

    const [vehRes, bookRes] = await Promise.all([
      supabase.from("vehicles").select("*, customers(*)").eq("id", id).single(),
      supabase
        .from("bookings")
        .select("*, services(*)")
        .eq("vehicle_id", id)
        .eq("tenant_id", profile.tenant_id)
        .order("booking_date", { ascending: false }),
    ])

    if (vehRes.data) setVehicle(vehRes.data as any)
    setBookings(bookRes.data ?? [])
    setLoading(false)
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><p className="text-muted-foreground">Cargando...</p></div>
  }

  if (!vehicle) {
    return <div className="flex items-center justify-center min-h-[60vh]"><p className="text-muted-foreground">Vehículo no encontrado</p></div>
  }

  const customer = vehicle.customers
  const totalSpent = bookings
    .filter(b => b.status === "delivered")
    .reduce((sum, b) => sum + ((b.services as any)?.price ?? 0), 0)

  return (
    <div className="max-w-2xl">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" /> Volver
      </Button>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Car className="h-8 w-8 text-muted-foreground" />
            <div>
              <CardTitle>{vehicle.plate}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {[vehicle.brand, vehicle.model].filter(Boolean).join(" ")}
                {vehicle.year ? ` (${vehicle.year})` : ""}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {customer && (
              <>
                <div>
                  <span className="text-muted-foreground">Cliente</span>
                  <p className="font-medium">{customer.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Teléfono</span>
                  <p className="font-medium">{customer.phone}</p>
                </div>
              </>
            )}
            {vehicle.vin && (
              <div>
                <span className="text-muted-foreground">VIN</span>
                <p className="font-medium font-mono text-xs">{vehicle.vin}</p>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Total gastado</span>
              <p className="font-medium">$ {totalSpent.toLocaleString("es-CL")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Calendar className="h-5 w-5" /> Historial de servicios
      </h2>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Wrench className="h-8 w-8 mx-auto mb-2" />
            <p>Sin servicios registrados para este vehículo</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <Card key={b.id}>
              <CardContent className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{b.booking_date}</span>
                    <span className="text-muted-foreground">{b.booking_time?.slice(0, 5)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {(b as any).services?.name ?? "Servicio"}
                    {(b as any).services?.price ? ` - $${(b as any).services.price.toLocaleString("es-CL")}` : ""}
                  </p>
                </div>
                <Badge className={STATUS_BADGE_CLASSES[b.status as import("@/lib/types").BookingStatus]}>{STATUS_LABELS[b.status as import("@/lib/types").BookingStatus] || b.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
