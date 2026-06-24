"use client"

import { motion } from "framer-motion"
import { Globe, Calendar, Zap, Smartphone, CheckIcon } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const features = [
  {
    title: "Web Profesional",
    description: "Sitio optimizado SEO local, galería de trabajos, dominio personalizado.",
    icon: Globe,
    gradient: "from-indigo-500 to-purple-600",
    items: ["Dominio personalizado", "Optimizado SEO local", "Galería de trabajos"],
    colSpan: "md:col-span-2 md:row-span-2",
  },
  {
    title: "Agenda Online",
    description: "Tus clientes reservan desde tu web. Recibes confirmaciones y recordatorios.",
    icon: Calendar,
    gradient: "from-purple-500 to-pink-600",
    items: ["Reservas 24/7", "Recordatorios automáticos", "Sincronización calendario"],
    colSpan: "md:col-span-2",
  },
  {
    title: "Notificaciones",
    description: "Recordatorios por WhatsApp. Menos ausencias, más clientes.",
    icon: Zap,
    gradient: "from-pink-500 to-rose-600",
    items: ["WhatsApp automatizado", "Confirmaciones", "Alertas de ausencia"],
    colSpan: "",
  },
  {
    title: "Panel Móvil",
    description: "Gestiona tu taller desde el celular. Dashboard responsive.",
    icon: Smartphone,
    gradient: "from-indigo-500 to-pink-600",
    items: ["Dashboard responsive", "CRM simple", "Reportes en tiempo real"],
    colSpan: "",
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", bounce: 0.3, duration: 1 } as const,
  },
}

export function FeaturesSection() {
  return (
    <section id="solucion" className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/5 via-purple-500/5 to-transparent" />
      <div className="absolute top-40 -left-32 w-80 h-80 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-40 -right-32 w-80 h-80 rounded-full bg-pink-500/10 blur-[100px] pointer-events-none" />

      <div className="container mx-auto relative z-10 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/50 px-4 py-1.5 text-sm backdrop-blur-sm mb-4">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
            </span>
            <span className="text-muted-foreground">Solución</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Web + Agenda + Fidelización
            </span>
          </h2>
          <p className="mt-4 text-muted-foreground text-lg max-w-xl mx-auto">
            Todo lo que necesitas para digitalizar tu taller en un solo lugar
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-4 gap-4"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -4 }}
              className={`group relative rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 md:p-8 cursor-pointer overflow-hidden ${feature.colSpan}`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.03] via-purple-500/[0.03] to-pink-500/[0.03] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 shadow-lg`}
              >
                <feature.icon className="h-6 w-6 text-white" />
              </div>

              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                {feature.description}
              </p>

              <ul className="mt-4 space-y-2">
                {feature.items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-10"
        >
          <Button size="lg" className="gap-2" asChild>
            <Link href="/signup">
              Solicitar Demo <span aria-hidden="true">&rarr;</span>
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
