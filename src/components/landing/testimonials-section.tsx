"use client"

import { motion } from "framer-motion"
import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Carlos M.",
    workshop: "Taller Mecánico Pérez",
    text: "Desde que uso CLICIO, las reservas llegaron solas. Ya no pierdo llamadas perdidas.",
    color: "from-indigo-500 to-purple-600",
  },
  {
    name: "Andrea L.",
    workshop: "Auto Servicio La Vega",
    text: "La fidelización es un antes y después. Mis clientes vuelven por los sellos.",
    color: "from-purple-500 to-pink-600",
  },
  {
    name: "Pedro G.",
    workshop: "Gomería Express",
    text: "En 15 minutos tenía mi página lista. Mis clientes agendan solos.",
    color: "from-pink-500 to-rose-600",
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", bounce: 0.3, duration: 1.2 } as const,
  },
}

export function TestimonialsSection() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-purple-500/5 via-pink-500/5 to-transparent" />
      <div className="absolute top-20 left-1/4 w-52 h-52 rounded-full bg-purple-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-44 h-44 rounded-full bg-pink-500/10 blur-[100px] pointer-events-none" />

      <div className="container relative z-10 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/50 px-4 py-1.5 text-sm backdrop-blur-sm mb-4">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-purple-500" />
            </span>
            <span className="text-muted-foreground">Testimonios</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Lo que dicen los talleres
            </span>
          </h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-5"
        >
          {testimonials.map((t) => (
            <motion.div
              key={t.name}
              variants={itemVariants}
              whileHover={{ y: -6, scale: 1.02 }}
              className="group relative rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/[0.03] via-purple-500/[0.03] to-pink-500/[0.03] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

              <div className="flex items-center gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              <p className="text-sm text-muted-foreground mb-5 leading-relaxed relative z-10">
                &ldquo;{t.text}&rdquo;
              </p>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${t.color} rounded-full blur-md opacity-60 group-hover:opacity-100 transition-opacity`}
                  />
                  <div
                    className={`relative w-9 h-9 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-xs font-bold text-white`}
                  >
                    {t.name.charAt(0)}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.workshop}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
