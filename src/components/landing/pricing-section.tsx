"use client"

import { motion } from "framer-motion"
import { Check, ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const features = [
  "Página web profesional",
  "Hosting incluido",
  "Agenda online 24/7",
  "CRM básico",
  "WhatsApp automatizado",
  "Sistema de fidelización",
  "Soporte prioritario",
]

export function PricingSection() {
  return (
    <section id="precio" className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/5 via-purple-500/5 to-transparent" />
      <div className="absolute top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-indigo-500/8 to-pink-500/8 blur-[150px] pointer-events-none" />

      <div className="container mx-auto relative z-10 max-w-md px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-background/50 px-4 py-1.5 text-sm backdrop-blur-sm mb-5">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            <span className="text-muted-foreground">Precio</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Plan Único. Sin Sorpresas.
            </span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15, type: "spring", bounce: 0.25, duration: 1.2 }}
          whileHover={{ y: -6 }}
          className="relative rounded-2xl border border-border/40 bg-gradient-to-br from-card/60 to-card/30 backdrop-blur-xl p-8 shadow-2xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.03] via-purple-500/[0.03] to-pink-500/[0.03] pointer-events-none" />
          <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-gradient-to-br from-indigo-500/20 to-pink-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-gradient-to-br from-purple-500/15 to-transparent blur-3xl pointer-events-none" />

          <div className="relative z-10 text-center">
            <span className="inline-flex px-4 py-1.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white text-xs font-semibold rounded-full mb-5 shadow-lg shadow-indigo-500/25">
              Plan Único
            </span>

            <div className="mt-6">
              <span className="text-6xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                $39.990
              </span>
              <span className="text-lg font-normal text-muted-foreground ml-2">/mes</span>
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              Todo incluido. Sin cargos ocultos. Cancela cuando quieras.
            </p>
          </div>

          <div className="relative z-10 mt-8">
            <div className="border-t border-border/30 my-6" />
            <ul className="space-y-3.5">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm">
                  <div className="h-5 w-5 rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 flex items-center justify-center shrink-0 shadow-sm">
                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  </div>
                  <span className="text-foreground/90">{f}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative z-10 mt-8">
            <Button size="lg" className="w-full gap-2 group relative overflow-hidden" asChild>
              <Link href="/signup">
                <span className="relative z-10">Quiero mi sistema</span>
                <ArrowRight className="h-4 w-4 relative z-10 transition-transform group-hover:translate-x-1" />
                <span className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
