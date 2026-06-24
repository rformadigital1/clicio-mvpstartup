"use client"

import { motion, type Variants } from "framer-motion"
import { Calendar, Users, Clock, Star, ChevronRight, Sparkles } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, filter: "blur(12px)", y: 16 },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    y: 0,
    transition: { type: "spring", bounce: 0.3, duration: 1.5 } as const,
  },
} satisfies Variants

function StatCard({ icon, value, label, gradient }: { icon: React.ReactNode; value: string; label: string; gradient: string }) {
  return (
    <div className="rounded-2xl border border-border/30 bg-background/40 backdrop-blur-sm p-5 text-center">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mx-auto mb-3 shadow-lg`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  )
}

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[280px] sm:w-[310px]">
      <div className="relative rounded-[2.5rem] border-[8px] border-gray-800 bg-gray-800 shadow-2xl">
        <div className="absolute left-1/2 top-0 h-6 w-32 -translate-x-1/2 rounded-b-2xl bg-gray-800" />
        <div className="overflow-hidden rounded-[2rem] bg-white">
          <div className="h-[560px] sm:h-[600px] overflow-y-auto">
            <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4 text-white">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-base font-bold">CLICIO</div>
                <div className="flex items-center gap-1.5">
                  <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-medium">
                    TA
                  </div>
                </div>
              </div>
              <h2 className="text-lg font-bold mb-0.5">Panel Taller</h2>
              <p className="text-[11px] text-white/80">Gestiona tus citas y servicios</p>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-xl border border-gray-100 bg-gradient-to-br from-indigo-50 to-indigo-100 p-3">
                  <Calendar className="h-4 w-4 text-indigo-600 mb-1.5" />
                  <div className="text-xl font-bold text-indigo-900">24</div>
                  <div className="text-[10px] text-indigo-600">Citas Hoy</div>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gradient-to-br from-purple-50 to-purple-100 p-3">
                  <Users className="h-4 w-4 text-purple-600 mb-1.5" />
                  <div className="text-xl font-bold text-purple-900">156</div>
                  <div className="text-[10px] text-purple-600">Clientes</div>
                </div>
              </div>
              <div className="pt-1">
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-xs font-semibold text-gray-900">Próximas Citas</h3>
                  <button className="text-[10px] text-indigo-600 font-medium">Ver todas</button>
                </div>
                <div className="space-y-2">
                  {[
                    { initials: "MC", name: "María C.", service: "Cambio de aceite", time: "10:00", bg: "bg-indigo-100", text: "text-indigo-700" },
                    { initials: "JR", name: "Juan R.", service: "Alineación", time: "11:30", bg: "bg-purple-100", text: "text-purple-700" },
                    { initials: "AS", name: "Ana S.", service: "Frenos", time: "14:00", bg: "bg-pink-100", text: "text-pink-700" },
                  ].map((item, i) => (
                    <div key={i} className="rounded-lg border border-gray-100 bg-white p-2.5 shadow-sm">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className={`h-7 w-7 rounded-full ${item.bg} flex items-center justify-center text-[10px] font-semibold ${item.text}`}>
                            {item.initials}
                          </div>
                          <div>
                            <div className="text-[11px] font-semibold text-gray-900">{item.name}</div>
                            <div className="text-[9px] text-gray-500">{item.service}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[11px] font-semibold text-gray-900">{item.time}</div>
                          <div className="text-[9px] text-gray-500">45 min</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/10 via-purple-500/5 to-transparent" />
      <div className="absolute top-20 -left-20 w-[500px] h-[500px] rounded-full bg-indigo-500/8 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-20 -right-20 w-[500px] h-[500px] rounded-full bg-pink-500/8 blur-[150px] pointer-events-none" />

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            <motion.div variants={itemVariants} className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/30 bg-background/50 px-4 py-1.5 text-sm backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
                </span>
                <span className="text-muted-foreground">Disponible ahora</span>
              </div>

              <h1 className="text-4xl font-bold sm:text-5xl md:text-6xl lg:text-7xl tracking-tight">
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Reservas Online
                </span>
                <br />
                <span className="text-foreground">Para Tu Taller</span>
              </h1>

              <p className="max-w-xl text-lg text-muted-foreground leading-relaxed">
                Olvídate de las llamadas perdidas y las agendas desordenadas.
                Tus clientes reservan desde tu web, tú recibes confirmaciones automáticas.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-wrap gap-4">
              <Button size="lg" className="gap-2 group relative overflow-hidden shadow-lg shadow-indigo-500/20" asChild>
                <Link href="/signup">
                  <span className="relative z-10">Comenzar Gratis</span>
                  <ChevronRight className="h-4 w-4 relative z-10 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="border-border/40 backdrop-blur-sm" asChild>
                <Link href="#solucion">Ver Solución</Link>
              </Button>
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3 pt-4">
              <StatCard icon={<Calendar className="h-5 w-5 text-white" />} value="50K+" label="Citas gestionadas" gradient="from-indigo-500 to-purple-600" />
              <StatCard icon={<Users className="h-5 w-5 text-white" />} value="500+" label="Talleres activos" gradient="from-purple-500 to-pink-600" />
              <StatCard icon={<Star className="h-5 w-5 text-white" />} value="4.9" label="Satisfacción" gradient="from-pink-500 to-rose-600" />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8, type: "spring", bounce: 0.2 }}
            className="relative"
          >
            <div className="relative">
              <div className="absolute -inset-6 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-3xl" />
              <div className="relative">
                <PhoneMockup />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
