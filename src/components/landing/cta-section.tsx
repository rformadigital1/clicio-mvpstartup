"use client"

import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"

export function CTASection() {
  return (
    <section className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/5 via-indigo-500/3 to-transparent" />

      <div className="container mx-auto relative z-10 max-w-2xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, type: "spring", bounce: 0.2 }}
          className="relative rounded-2xl border border-border/30 bg-card/80 p-10 md:p-14 text-center shadow-xl overflow-hidden"
        >
          <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              <span className="text-foreground">
                Empieza a recuperar
              </span>
              <br />
              <span className="text-indigo-600 dark:text-indigo-400">
                clientes hoy
              </span>
            </h2>

            <p className="text-muted-foreground text-lg max-w-lg mx-auto mb-8">
              En menos de 15 minutos tu taller tiene presencia profesional en internet.
              Tus clientes reservan solos mientras trabajas.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="/signup" className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium h-10 px-8 bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-colors cursor-pointer rounded-lg">
                Pruébalo 14 días gratis
                <ArrowRight className="h-4 w-4" />
              </a>
              <a href="#solucion" className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium h-10 px-8 border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer rounded-lg">
                Ver cómo funciona
              </a>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Sin tarjeta. Sin compromiso. Cancela cuando quieras.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
