"use client"

import { motion } from "framer-motion"
import { ChevronRight, Clock, TrendingUp, Calendar } from "lucide-react"


const timeline = [
  {
    time: "10:00",
    initials: "MC",
    name: "María C.",
    plate: "ABC123",
    service: "Cambio de aceite",
    status: "Reservado",
    borderColor: "border-l-indigo-500",
    bgColor: "bg-indigo-100 dark:bg-indigo-900/40",
    textColor: "text-indigo-700 dark:text-indigo-300",
    badgeBg: "bg-indigo-100 dark:bg-indigo-900/40",
    badgeText: "text-indigo-700 dark:text-indigo-300",
  },
  {
    time: "11:30",
    initials: "JR",
    name: "Juan R.",
    plate: "DEF456",
    service: "Alineación y balanceo",
    status: "En taller",
    borderColor: "border-l-amber-500",
    bgColor: "bg-amber-100 dark:bg-amber-900/40",
    textColor: "text-amber-700 dark:text-amber-300",
    badgeBg: "bg-amber-100 dark:bg-amber-900/40",
    badgeText: "text-amber-700 dark:text-amber-300",
  },
  {
    time: "14:00",
    initials: "AS",
    name: "Ana S.",
    plate: "GHI789",
    service: "Pastillas de freno",
    status: "Listo",
    borderColor: "border-l-emerald-500",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/40",
    textColor: "text-emerald-700 dark:text-emerald-300",
    badgeBg: "bg-emerald-100 dark:bg-emerald-900/40",
    badgeText: "text-emerald-700 dark:text-emerald-300",
  },
]

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/8 via-indigo-500/3 to-transparent pointer-events-none" />
      <div className="absolute top-20 -left-20 w-[500px] h-[500px] rounded-full bg-indigo-500/5 blur-[150px] pointer-events-none" />

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-16 lg:py-24">
        <div className="flex flex-col-reverse lg:flex-row gap-16 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, type: "spring", bounce: 0.2 }}
            className="flex-1 space-y-8 max-w-xl"
          >
            <div className="space-y-6">
              <h1 className="text-4xl font-bold sm:text-5xl md:text-6xl lg:text-7xl tracking-tight leading-[1.1]">
                <span className="text-foreground">
                  Se terminaron las
                </span>
                <br />
                <span className="text-indigo-600 dark:text-indigo-400">
                  llamadas perdidas
                </span>
              </h1>

              <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                Tus clientes reservan solos desde el celular. Te llega la confirmación mientras trabajas tranquilo.
                Sin contestar WhatsApp a las 11 de la noche.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <a href="/signup" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium h-10 px-8 bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/25 transition-colors cursor-pointer">
                Pruébalo 14 días gratis
                <ChevronRight className="h-4 w-4" />
              </a>
              <a href="#solucion" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium h-10 px-8 border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer">
                Ver cómo funciona
              </a>
            </div>

            <p className="text-sm text-muted-foreground">
              Sin tarjeta de crédito. Sin compromiso. Cancela cuando quieras.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.8, type: "spring", bounce: 0.2 }}
            className="relative flex-1 max-w-lg w-full"
          >
            <div className="relative">
              <div className="absolute -top-3 -left-3 w-full h-full rounded-xl bg-gradient-to-br from-indigo-400/40 to-indigo-500/30 -z-10 rotate-6" />
              <div className="absolute -top-6 -left-6 w-full h-full rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 -z-20 rotate-12" />

              <div className="relative bg-background rounded-xl shadow-2xl border border-border/30 overflow-hidden rotate-2 hover:rotate-0 transition-transform duration-500">
                <div className="bg-card border-b border-border/20 px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">CLICIO · Panel del Taller</span>
                  <div className="w-3 h-3 rounded-full bg-indigo-600" />
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Hola, Taller Muñoz</h3>
                    <p className="text-[11px] text-muted-foreground">viernes, 27 de junio de 2026 — Resumen del día</p>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-lg p-2.5 border border-indigo-100 dark:border-indigo-900/30">
                      <div className="text-[9px] text-muted-foreground font-medium mb-0.5">Reservas hoy</div>
                      <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">8</div>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-2.5 border border-amber-100 dark:border-amber-900/30">
                      <div className="text-[9px] text-muted-foreground font-medium mb-0.5">En taller</div>
                      <div className="text-lg font-bold text-amber-600 dark:text-amber-400">3</div>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-2.5 border border-emerald-100 dark:border-emerald-900/30">
                      <div className="text-[9px] text-muted-foreground font-medium mb-0.5">Listos</div>
                      <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">2</div>
                    </div>
                    <div className="bg-sky-50 dark:bg-sky-950/30 rounded-lg p-2.5 border border-sky-100 dark:border-sky-900/30">
                      <div className="text-[9px] text-muted-foreground font-medium mb-0.5">Hoy</div>
                      <div className="text-lg font-bold text-sky-600 dark:text-sky-400">$286K</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-indigo-600" />
                      <span className="text-[10px] font-semibold text-foreground">Timeline del día</span>
                    </div>

                    {timeline.map((item) => (
                      <div key={item.time} className="flex items-start gap-2">
                        <div className="w-10 text-right shrink-0 pt-1.5">
                          <span className="text-[10px] font-medium text-muted-foreground">{item.time}</span>
                        </div>
                        <div className={`flex-1 bg-card border border-border/20 rounded-lg p-2.5 border-l-[3px] ${item.borderColor} flex items-start gap-2`}>
                          <div className={`w-7 h-7 rounded-full ${item.bgColor} flex items-center justify-center text-[9px] font-bold ${item.textColor} shrink-0`}>
                            {item.initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1">
                              <span className="text-[11px] font-semibold text-foreground truncate">{item.name}</span>
                              <span className={`text-[8px] ${item.badgeBg} ${item.badgeText} px-1.5 py-0.5 rounded-full font-medium shrink-0`}>
                                {item.status}
                              </span>
                            </div>
                            <div className="text-[9px] text-muted-foreground">{item.plate} · {item.service}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 pt-2 border-t border-border/10">
                    <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
                      <TrendingUp className="h-3 w-3 text-emerald-500" />
                      +23% vs mes pasado
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
                      <Calendar className="h-3 w-3 text-indigo-500" />
                      42 reservas este mes
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-6 -right-6 w-40 bg-background rounded-[2rem] shadow-2xl border border-border/30 overflow-hidden -rotate-6 hover:rotate-0 transition-transform duration-500">
                <div className="bg-muted/30 px-4 py-2 flex justify-between items-center text-xs border-b border-border/20">
                  <span className="font-semibold text-foreground">9:41</span>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-1.5 bg-green-500 rounded-sm" />
                    <span className="text-[9px] text-muted-foreground">100%</span>
                  </div>
                </div>
                <div className="p-3 space-y-2.5">
                  <div className="flex items-center gap-2 pb-2 border-b border-border/10">
                    <div className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-[8px]">C</span>
                    </div>
                    <span className="text-xs font-semibold text-foreground">CLICIO</span>
                  </div>
                  <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-lg p-2 border border-indigo-100 dark:border-indigo-900/30">
                    <p className="text-[9px] font-medium text-indigo-700 dark:text-indigo-300">Nueva reserva</p>
                    <p className="text-[8px] text-muted-foreground">María C. · 10:00</p>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-2 border border-amber-100 dark:border-amber-900/30">
                    <p className="text-[9px] font-medium text-amber-700 dark:text-amber-300">Cliente llegó</p>
                    <p className="text-[8px] text-muted-foreground">Juan R. · Alineación</p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-2 border border-emerald-100 dark:border-emerald-900/30">
                    <p className="text-[9px] font-medium text-emerald-700 dark:text-emerald-300">Vehículo listo</p>
                    <p className="text-[8px] text-muted-foreground">Ana S. · Pastillas</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
