"use client"

import { motion } from "framer-motion"
import { Star, Quote, Sparkles } from "lucide-react"

const testimonials = [
  {
    name: "Carlos M.",
    workshop: "Taller Mecánico Pérez",
    text: "Desde que uso CLICIO, las reservas llegaron solas. Ya no pierdo llamadas perdidas y mis clientes agendan直接 desde la web.",
    color: "from-indigo-500 to-purple-600",
    rating: 5,
  },
  {
    name: "Andrea L.",
    workshop: "Auto Servicio La Vega",
    text: "Ahora tengo todo en orden: clientes, vehículos y servicios registrados. Mi taller nunca había estado tan organizado.",
    color: "from-purple-500 to-pink-600",
    rating: 5,
  },
  {
    name: "Pedro G.",
    workshop: "Gomería Express",
    text: "En 15 minutos tenía mi página lista. Mis clientes agendan solos y ya no pierdo tiempo contestando WhatsApp.",
    color: "from-pink-500 to-rose-600",
    rating: 5,
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
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-purple-500/5 via-pink-500/5 to-transparent" />
      <div className="absolute top-40 left-1/3 w-72 h-72 rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-40 right-1/3 w-72 h-72 rounded-full bg-pink-500/10 blur-[120px] pointer-events-none" />

      <div className="container mx-auto relative z-10 max-w-5xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-background/50 px-4 py-1.5 text-sm backdrop-blur-sm mb-5">
            <Sparkles className="h-3.5 w-3.5 text-purple-500" />
            <span className="text-muted-foreground">Testimonios</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Lo que dicen los talleres
            </span>
          </h2>
          <p className="mt-4 text-muted-foreground text-lg max-w-xl mx-auto">
            Más de 50 talleres confían en CLICIO para digitalizar su negocio.
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
              whileHover={{ y: -8, scale: 1.02 }}
              className="group relative rounded-2xl border border-border/40 bg-gradient-to-br from-card/60 to-card/30 backdrop-blur-xl p-7"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/[0.03] via-purple-500/[0.03] to-pink-500/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <Quote className="h-8 w-8 text-indigo-500/20 mb-3" />

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

              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className={`absolute inset-0 bg-gradient-to-br ${t.color} rounded-full blur-lg opacity-60 group-hover:opacity-100 transition-opacity duration-300`} />
                  <div className={`relative w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-sm font-bold text-white shadow-lg`}>
                    {t.name.charAt(0)}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
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
