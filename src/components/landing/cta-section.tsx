"use client"

import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

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
              <Button size="lg" className="gap-2 group relative overflow-hidden shadow-lg shadow-indigo-500/20" asChild>
                <Link href="/signup">
                  <span className="relative z-10">Pruébalo 7 días gratis</span>
                  <ArrowRight className="h-4 w-4 relative z-10 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="border-border/50 backdrop-blur-sm" asChild>
                <Link href="#solucion">Ver cómo funciona</Link>
              </Button>
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
