"use client"

import { motion } from "framer-motion"
import { ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function CTASection() {
  return (
    <section className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-purple-500/5 to-pink-500/10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-indigo-500/15 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-pink-500/15 via-transparent to-transparent" />

      <div className="container mx-auto relative z-10 max-w-2xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, type: "spring", bounce: 0.2 }}
          className="relative rounded-2xl border border-border/30 bg-gradient-to-br from-card/40 to-card/10 backdrop-blur-2xl p-10 md:p-14 text-center shadow-2xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.04] via-purple-500/[0.04] to-pink-500/[0.04] pointer-events-none" />
          <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-64 h-64 rounded-full bg-gradient-to-br from-pink-500/20 to-transparent blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-background/30 px-4 py-1.5 text-sm backdrop-blur-sm mb-6">
              <Sparkles className="h-3.5 w-3.5 text-pink-500" />
              <span className="text-muted-foreground">Comienza hoy</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Tu taller merece estar online
              </span>
            </h2>

            <p className="text-muted-foreground text-lg max-w-lg mx-auto mb-8">
              En menos de 15 minutos tu taller tiene presencia profesional en internet.
              Sin conocimientos técnicos. Sin esperar semanas.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="gap-2 group relative overflow-hidden shadow-lg shadow-indigo-500/20" asChild>
                <Link href="/signup">
                  <span className="relative z-10">Solicitar Demo Gratis</span>
                  <ArrowRight className="h-4 w-4 relative z-10 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="border-border/50 backdrop-blur-sm" asChild>
                <Link href="#solucion">Ver cómo funciona</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
