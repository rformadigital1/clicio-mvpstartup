"use client"

import { motion } from "framer-motion"
import { Star, Quote, BadgeCheck } from "lucide-react"

const testimonials = [
  {
    name: "Ricardo Muñoz",
    workshop: "Taller Mecánico Muñoz, Rancagua",
    text: "Perdía llamadas todos los días porque estaba metido en los autos. Desde que tengo CLICIO, los clientes agendan solos y yo solo trabajo. En dos meses recuperé clientes que había perdido.",
    avatar: "RM",
    color: "bg-indigo-600",
    rating: 5,
    result: "Recuperé 15 clientes en 2 meses",
  },
  {
    name: "Ana Soto",
    workshop: "Auto Servicios La Vega, Santiago",
    text: "Tenía WhatsApp personal y del taller todo mezclado. Llegaban mensajes a las 11 de la noche. Ahora los clientes reservan desde la página y yo tengo mi WhatsApp tranquilo. Nunca había estado tan ordenada.",
    avatar: "AS",
    color: "bg-emerald-600",
    rating: 5,
    result: "WhatsApp del taller separado del personal",
  },
  {
    name: "Pedro Gutiérrez",
    workshop: "Gomería Express, Maipú",
    text: "Pensé que esto de la página web era caro y complicado. En 15 minutos tenía todo listo. Al día siguiente ya había agendado un cliente que me encontró por Google. Facturé $80.000 esa semana solo por eso.",
    avatar: "PG",
    color: "bg-amber-600",
    rating: 5,
    result: "$80.000 extra la primera semana",
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", bounce: 0.3, duration: 1.2 } as const,
  },
}

export function TestimonialsSection() {
  return (
    <section className="relative py-28 overflow-hidden">
      <div className="absolute top-40 left-1/3 w-72 h-72 rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />

      <div className="container mx-auto relative z-10 max-w-5xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            <span className="text-foreground">Talleres como el tuyo</span>{" "}
            <span className="text-indigo-600 dark:text-indigo-400">ya usan CLICIO</span>
          </h2>
          <p className="mt-4 text-muted-foreground text-lg max-w-xl mx-auto">
            Dueños de taller que dejaron de perder clientes y recuperaron el control de su negocio.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-6"
        >
          {testimonials.map((t, index) => (
            <motion.div
              key={t.name}
              variants={cardVariants}
              whileHover={{ y: -4 }}
              className="group relative rounded-2xl border border-border/30 bg-card/80 p-7"
            >
              <Quote className="h-8 w-8 text-muted-foreground/15 mb-3" />

              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < t.rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/20"}`}
                  />
                ))}
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed mb-6 relative z-10">
                &ldquo;{t.text}&rdquo;
              </p>

              <div className="border-t border-border/10 pt-4 mt-auto">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-sm font-bold text-white shadow-sm`}>
                    {t.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{t.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{t.workshop}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-3 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  {t.result}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
