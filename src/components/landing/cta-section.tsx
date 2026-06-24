"use client"

import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function CTASection() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-purple-500/5 to-pink-500/5" />
      <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-indigo-500/15 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-80 h-80 rounded-full bg-pink-500/15 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="container relative z-10 max-w-2xl text-center"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/50 px-4 py-1.5 text-sm backdrop-blur-sm mb-4">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pink-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-pink-500" />
          </span>
          <span className="text-muted-foreground">Comienza hoy</span>
        </div>

        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Comienza hoy
          </span>
        </h2>

        <p className="mt-4 text-muted-foreground text-lg">
          En menos de 15 minutos tu taller tiene presencia profesional en internet.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-8 flex gap-3 justify-center flex-wrap"
        >
          <Button size="lg" className="gap-2 group" asChild>
            <Link href="/signup">
              Solicitar Demo
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="#solucion">Ver más</Link>
          </Button>
        </motion.div>
      </motion.div>
    </section>
  )
}
