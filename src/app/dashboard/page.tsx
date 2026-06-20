"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Users, Car, Gift } from "lucide-react"

export default function DashboardPage() {
  const supabase = createClient()
  const [stats, setStats] = useState({ bookings: 0, customers: 0, services: 0, stamps: 0 })

  useEffect(() => {
    async function loadStats() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single()

      if (!profile) return

      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      const [bookingsRes, customersRes, servicesRes, stampsRes] = await Promise.all([
        supabase.from("bookings").select("*", { count: "exact", head: true }).eq("tenant_id", profile.tenant_id).gte("created_at", monthStart),
        supabase.from("customers").select("*", { count: "exact", head: true }).eq("tenant_id", profile.tenant_id),
        supabase.from("services").select("*", { count: "exact", head: true }).eq("tenant_id", profile.tenant_id),
        supabase.from("stamp_history").select("*", { count: "exact", head: true }).eq("tenant_id", profile.tenant_id).gte("created_at", monthStart),
      ])

      setStats({
        bookings: bookingsRes.count ?? 0,
        customers: customersRes.count ?? 0,
        services: servicesRes.count ?? 0,
        stamps: stampsRes.count ?? 0,
      })
    }

    loadStats()
  }, [supabase])

  const items = [
    { label: "Reservas del mes", value: stats.bookings, icon: Calendar },
    { label: "Clientes activos", value: stats.customers, icon: Users },
    { label: "Servicios", value: stats.services, icon: Car },
    { label: "Sellos entregados", value: stats.stamps, icon: Gift },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{item.label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{item.value}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
