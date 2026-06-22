"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Download, Calendar } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/ui/page-header"
import type { BookingStatus } from "@/lib/types"
import { STATUS_LABELS, STATUS_BADGE_CLASSES } from "@/lib/booking-constants"

export default function AgendaPage() {
  const supabase = createClient()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => { loadAgenda() }, [])

  async function loadAgenda() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single()
    if (!profile) return

    const today = new Date().toISOString().slice(0, 10)
    const { data } = await supabase
      .from("bookings")
      .select("*, customers(*), vehicles(*), booking_services(service_id, services(*)))")
      .eq("tenant_id", profile.tenant_id)
      .gte("booking_date", today)
      .order("booking_date", { ascending: true })
      .order("booking_time", { ascending: true })

    setBookings(data ?? [])
    setLoading(false)
  }

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      if (statusFilter !== "all" && b.status !== statusFilter) return false
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      const name = b.customers?.name?.toLowerCase() ?? ""
      const plate = b.vehicles?.plate?.toLowerCase() ?? ""
      const services = b.booking_services?.map((bs: any) => bs.services?.name).join(" ").toLowerCase() ?? ""
      return name.includes(q) || plate.includes(q) || services.includes(q)
    })
  }, [bookings, searchQuery, statusFilter])

  function exportCSV() {
    const rows = filteredBookings.map(b => {
      const servicesStr = b.booking_services?.map((bs: any) => bs.services?.name).filter(Boolean).join(", ") ?? ""
      return [
        b.booking_date,
        b.booking_time?.slice(0, 5),
        `"${(b.customers?.name ?? "").replace(/"/g, '""')}"`,
        `"${(b.customers?.phone ?? "").replace(/"/g, '""')}"`,
        `"${(b.vehicles?.plate ?? "").replace(/"/g, '""')}"`,
        `"${servicesStr.replace(/"/g, '""')}"`,
        STATUS_LABELS[b.status as BookingStatus] ?? "",
      ].join(",")
    })
    const csv = ["Fecha,Hora,Cliente,Teléfono,Vehículo,Servicios,Estado", ...rows].join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `agenda-${today()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function today() { return new Date().toISOString().slice(0, 10) }

  if (loading) return (
    <div>
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="flex gap-3 mb-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="rounded-xl border">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 p-4 border-b">
            <Skeleton className="h-5 flex-1" />
            <Skeleton className="h-5 flex-1" />
            <Skeleton className="h-5 flex-1" />
            <Skeleton className="h-5 w-24" />
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="animate-fade-in">
      <PageHeader title="Agenda">
        <Button variant="outline" onClick={exportCSV}>
          <Download className="mr-1 h-4 w-4" /> Exportar CSV
        </Button>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente, patente o servicio..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-8 w-64"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Filtrar estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-bg-superficie">
              <th className="text-left p-3 font-medium">Fecha</th>
              <th className="text-left p-3 font-medium">Hora</th>
              <th className="text-left p-3 font-medium">Cliente</th>
              <th className="text-left p-3 font-medium">Teléfono</th>
              <th className="text-left p-3 font-medium">Vehículo</th>
              <th className="text-left p-3 font-medium">Servicios</th>
              <th className="text-left p-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length === 0 ? (
              <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                Sin resultados
              </td></tr>
            ) : (
              filteredBookings.map(b => (
                <tr key={b.id} className="border-b hover:bg-white/50 cursor-pointer transition-colors">
                  <td className="p-3">{b.booking_date}</td>
                  <td className="p-3">{b.booking_time?.slice(0, 5)}</td>
                  <td className="p-3">{b.customers?.name}</td>
                  <td className="p-3">{b.customers?.phone}</td>
                  <td className="p-3">{b.vehicles?.plate}</td>
                  <td className="p-3">{b.booking_services?.map((bs: any) => bs.services?.name).filter(Boolean).join(", ")}</td>
                  <td className="p-3">
                    <Badge className={STATUS_BADGE_CLASSES[b.status as BookingStatus]}>
                      {STATUS_LABELS[b.status as BookingStatus]}
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
