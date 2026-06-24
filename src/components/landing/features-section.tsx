"use client"

import { motion } from "framer-motion"
import { Globe, Calendar, Bell, Smartphone, Sparkles } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const features = [
  {
    title: "Web Profesional",
    description: "Sitio web optimizado para Google, adaptado a móviles, con tu información y galería de trabajos.",
    icon: Globe,
    gradient: "from-indigo-500 to-purple-600",
    items: ["Dominio personalizado", "Optimizado SEO local", "Galería de trabajos"],
    colSpan: "md:col-span-2 lg:col-span-2 lg:row-span-2",
    size: "lg",
  },
  {
    title: "Agenda Online",
    description: "Reservas 24/7 desde tu web con recordatorios automáticos.",
    icon: Calendar,
    gradient: "from-purple-500 to-pink-600",
    items: ["Reservas desde tu web", "Recordatorios automáticos", "Sincronización calendario"],
    colSpan: "md:col-span-2 lg:col-span-2",
    size: "sm",
  },
  {
    title: "Notificaciones",
    description: "Recordatorios por WhatsApp. Menos ausencias, más clientes.",
    icon: Bell,
    gradient: "from-pink-500 to-rose-600",
    items: ["WhatsApp automatizado", "Confirmaciones", "Alertas de ausencia"],
    colSpan: "md:col-span-1 lg:col-span-1",
    size: "sm",
  },
  {
    title: "Panel Móvil",
    description: "Gestiona tu taller desde el celular. Dashboard en tiempo real.",
    icon: Smartphone,
    gradient: "from-indigo-500 to-pink-600",
    items: ["Dashboard responsive", "CRM simple", "Reportes en tiempo real"],
    colSpan: "md:col-span-1 lg:col-span-1",
    size: "sm",
  },
]

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
      whileHover={{ y: -6, scale: 1.01 }}
      className={`group relative rounded-2xl border border-border/40 bg-gradient-to-br from-card/60 to-card/30 backdrop-blur-xl p-6 md:p-8 cursor-pointer overflow-hidden ${feature.colSpan}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.03] via-purple-500/[0.03] to-pink-500/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-gradient-to-br from-indigo-500/10 to-pink-500/10 blur-3xl group-hover:from-indigo-500/20 group-hover:to-pink-500/20 transition-all duration-500 pointer-events-none" />

      <div className="relative z-10">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 shadow-lg shadow-${feature.gradient.split(" ")[0].replace("from-", "")}/20`}>
          <feature.icon className="h-6 w-6 text-white" />
        </div>

        <h3 className="text-xl font-bold mb-2 text-foreground">{feature.title}</h3>
        <p className="text-muted-foreground leading-relaxed text-sm mb-4">
          {feature.description}
        </p>

        <ul className="space-y-2.5">
          {feature.items.map((item) => (
            <li key={item} className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 opacity-40" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-gradient-to-r from-indigo-500 to-pink-500" />
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  )
}

export function FeaturesSection() {
  return (
    <section id="solucion" className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/5 via-purple-500/5 to-transparent" />
      <div className="absolute top-20 -left-40 w-96 h-96 rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-20 -right-40 w-96 h-96 rounded-full bg-pink-500/10 blur-[120px] pointer-events-none" />

      <div className="container mx-auto relative z-10 max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-background/50 px-4 py-1.5 text-sm backdrop-blur-sm mb-5">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            <span className="text-muted-foreground">Solución Todo-en-Uno</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Web + Agenda + Fidelización
            </span>
          </h2>
          <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
            Todo lo que necesitas para digitalizar tu taller mecánico en un solo lugar.
            Sin complicaciones. Sin contratos largos.
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
          <Button size="lg" className="gap-2 group relative overflow-hidden" asChild>
            <Link href="/signup">
              <span className="relative z-10">Solicitar Demo Gratis</span>
              <span className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
