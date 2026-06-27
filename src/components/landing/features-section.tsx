"use client"

import { motion } from "framer-motion"
import { Globe, Calendar, Users, BarChart3, CheckCircle, Clock, ChevronRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const features = [
  {
    title: "Tu taller en Google",
    description: "Página web profesional con tus servicios, fotos de trabajos y link directo a WhatsApp. Cuando buscan un taller en tu zona, apareces.",
    icon: Globe,
    bg: "bg-indigo-50 dark:bg-indigo-950/30",
    textColor: "text-indigo-600 dark:text-indigo-400",
    items: ["Apareces en Google Maps", "Galería de trabajos", "Link directo a WhatsApp"],
    colSpan: "md:col-span-2 lg:col-span-2 lg:row-span-2",
    size: "lg",
    mockup: "tenant-page",
  },
  {
    title: "Reservas sin llamadas",
    description: "Tus clientes eligen servicio y horario desde su celular. Sin llamar, sin esperar. Te llega la confirmación al toque.",
    icon: Calendar,
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    textColor: "text-emerald-600 dark:text-emerald-400",
    items: ["Reservas 24/7 desde el celular", "Recordatorios automáticos", "Chao llamadas perdidas"],
    colSpan: "md:col-span-2 lg:col-span-2",
    size: "sm",
    mockup: "booking",
  },
  {
    title: "No te olvides de nadie",
    description: "Registra cada cliente, su vehículo y el historial de servicios. Sabes quién vino, cuándo y qué se hizo. Todo en un solo lugar.",
    icon: Users,
    bg: "bg-amber-50 dark:bg-amber-950/30",
    textColor: "text-amber-600 dark:text-amber-400",
    items: ["Historial por vehículo", "Clientes frecuentes", "Notas de cada servicio"],
    colSpan: "md:col-span-1 lg:col-span-1",
    size: "sm",
    mockup: null,
  },
  {
    title: "Ves si ganaste plata",
    description: "Dashboard simple con los ingresos del día, del mes y del año. Separas las cuentas del taller de las tuyas. Sin Excel, sin vueltas.",
    icon: BarChart3,
    bg: "bg-sky-50 dark:bg-sky-950/30",
    textColor: "text-sky-600 dark:text-sky-400",
    items: ["Ingresos del día y del mes", "Servicios más vendidos", "Ganancias por cliente"],
    colSpan: "md:col-span-1 lg:col-span-1",
    size: "sm",
    mockup: null,
  },
]

function TenantPagePreview() {
  return (
    <div className="mt-4 rounded-lg border border-border/20 bg-background overflow-hidden shadow-sm">
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white">TM</div>
        <div>
          <div className="text-xs font-semibold text-white">Taller Mecánico Muñoz</div>
          <div className="text-[9px] text-indigo-200">Rancagua · 4.9★ (12 reseñas)</div>
        </div>
      </div>
      <div className="p-3 space-y-2">
        <div className="flex gap-2">
          <div className="flex-1 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg p-2.5 text-center border border-indigo-100 dark:border-indigo-900/30">
            <WrenchIcon className="h-4 w-4 text-indigo-600 mx-auto mb-1" />
            <div className="text-[9px] font-medium text-foreground">Cambio de aceite</div>
            <div className="text-[9px] text-muted-foreground">$25.000 · 45 min</div>
          </div>
          <div className="flex-1 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-2.5 text-center border border-emerald-100 dark:border-emerald-900/30">
            <WrenchIcon className="h-4 w-4 text-emerald-600 mx-auto mb-1" />
            <div className="text-[9px] font-medium text-foreground">Alineación</div>
            <div className="text-[9px] text-muted-foreground">$18.000 · 30 min</div>
          </div>
          <div className="flex-1 bg-amber-50 dark:bg-amber-950/30 rounded-lg p-2.5 text-center border border-amber-100 dark:border-amber-900/30">
            <WrenchIcon className="h-4 w-4 text-amber-600 mx-auto mb-1" />
            <div className="text-[9px] font-medium text-foreground">Frenos</div>
            <div className="text-[9px] text-muted-foreground">$45.000 · 60 min</div>
          </div>
        </div>
        <button className="w-full py-2 bg-indigo-600 text-white text-[10px] font-semibold rounded-lg flex items-center justify-center gap-1">
          <Calendar className="h-3 w-3" />
          Agendar hora online
        </button>
        <div className="flex items-center gap-1.5 text-[8px] text-muted-foreground justify-center">
          <CheckCircle className="h-2.5 w-2.5 text-emerald-500" />
          Confirmación automática por WhatsApp
        </div>
      </div>
    </div>
  )
}

function BookingPreview() {
  return (
    <div className="mt-4 rounded-lg border border-border/20 bg-background overflow-hidden shadow-sm">
      <div className="grid grid-cols-2 gap-0">
        <div className="p-3 border-r border-border/20">
          <div className="flex items-center justify-between mb-3">
            <button className="text-[9px] text-muted-foreground">←</button>
            <span className="text-[9px] font-medium text-foreground">Junio 2026</span>
            <button className="text-[9px] text-muted-foreground">→</button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
            {["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"].map((d) => (
              <span key={d} className="text-[7px] text-muted-foreground font-medium">{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: 7 }).map((_, i) => (
              <span key={`e-${i}`} className="text-[8px] text-muted-foreground/30 py-1 text-center">{i + 25}</span>
            ))}
            {Array.from({ length: 7 }).map((_, i) => (
              <span key={i} className={`text-[8px] py-1 text-center rounded cursor-pointer ${i === 3 ? 'bg-indigo-600 text-white font-bold' : i < 3 ? 'text-foreground hover:bg-indigo-50 dark:hover:bg-indigo-950/30' : 'text-muted-foreground/30'}`}>
                {i + 1}
              </span>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-border/10">
            <div className="text-[8px] text-foreground font-medium mb-1.5">Horarios disponibles</div>
            <div className="flex flex-wrap gap-1">
              {["09:00", "10:00", "11:00"].map((t) => (
                <span key={t} className="text-[8px] px-2 py-1 rounded border border-border/30 text-foreground">{t}</span>
              ))}
              <span className="text-[8px] px-2 py-1 rounded bg-indigo-600 text-white font-medium">12:00</span>
              <span className="text-[8px] px-2 py-1 rounded border border-border/30 text-foreground">14:00</span>
            </div>
          </div>
        </div>
        <div className="p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[8px] font-medium text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 px-1.5 py-0.5 rounded">Paso 1 de 3</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 p-2 rounded bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/30">
                <input type="checkbox" checked readOnly className="h-3 w-3 accent-indigo-600" />
                <span className="text-[8px] text-foreground font-medium">Cambio de aceite</span>
                <span className="text-[8px] text-indigo-600 font-medium ml-auto">$25.000</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded border border-border/20">
                <input type="checkbox" className="h-3 w-3 accent-indigo-600" />
                <span className="text-[8px] text-foreground">Alineación</span>
                <span className="text-[8px] text-muted-foreground ml-auto">$18.000</span>
              </div>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-border/10 flex items-center justify-between">
            <span className="text-[8px] text-muted-foreground">Total: <strong className="text-indigo-600">$25.000</strong></span>
            <span className="text-[7px] bg-indigo-600 text-white px-2 py-0.5 rounded font-medium flex items-center gap-0.5">
              Siguiente <ChevronRight className="h-2.5 w-2.5" />
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", bounce: 0.25, duration: 1 } as const,
  },
}

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -4 }}
      className={`group relative rounded-2xl border border-border/30 bg-card/80 p-6 md:p-8 overflow-hidden ${feature.colSpan}`}
    >
      <div className="relative z-10">
        <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-5`}>
          <feature.icon className={`h-6 w-6 ${feature.textColor}`} />
        </div>

        <h3 className="text-xl font-bold mb-2 text-foreground">{feature.title}</h3>
        <p className="text-muted-foreground leading-relaxed text-sm mb-4">
          {feature.description}
        </p>

        <ul className="space-y-2">
          {feature.items.map((item) => (
            <li key={item} className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
              {item}
            </li>
          ))}
        </ul>

        {feature.mockup === "tenant-page" && <TenantPagePreview />}
        {feature.mockup === "booking" && <BookingPreview />}
      </div>
    </motion.div>
  )
}

function WrenchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75a4.5 4.5 0 0 1-4.884 4.484c-1.076-.091-2.264.071-2.95.904l-7.152 8.684a2.548 2.548 0 1 1-3.586-3.586l8.684-7.152c.833-.686.995-1.874.904-2.95a4.5 4.5 0 0 1 6.336-4.486l-3.276 3.276a3.004 3.004 0 0 0 2.25 2.25l3.276-3.276c.256.565.398 1.192.398 1.852Z" />
    </svg>
  )
}

export function FeaturesSection() {
  return (
    <section id="solucion" className="relative py-28 overflow-hidden">
      <div className="absolute top-20 -left-40 w-96 h-96 rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />

      <div className="container mx-auto relative z-10 max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            <span className="text-foreground">Tu taller en línea,</span>{" "}
            <span className="text-indigo-600 dark:text-indigo-400">sin complicaciones</span>
          </h2>
          <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
            Todo lo que necesitas para dejar de perder clientes y tener el control de tu taller.
            Sin conocimientos de tecnología. Sin contratos largos.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-center mt-12"
        >
          <Button size="lg" className="gap-2 group relative overflow-hidden shadow-lg shadow-indigo-500/20" asChild>
            <Link href="/signup">
              <span className="relative z-10">Pruébalo 7 días gratis</span>
              <span className="absolute inset-0 bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
