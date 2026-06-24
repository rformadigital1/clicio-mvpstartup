"use client"

import { motion } from "framer-motion"
import { CheckIcon, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const features = [
  "Página web profesional",
  "Hosting incluido",
  "Agenda online",
  "CRM básico",
  "WhatsApp automatizado",
  "Sistema de fidelización",
]

export function PricingSection() {
  return (
    <section id="precio" className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/5 via-purple-500/5 to-transparent" />
      <div className="absolute top-40 left-1/3 w-64 h-64 rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="container mx-auto relative z-10 max-w-md text-center"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/50 px-4 py-1.5 text-sm backdrop-blur-sm mb-4">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
          </span>
          <span className="text-muted-foreground">Precio</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, type: "spring", bounce: 0.3, duration: 1.2 }}
          whileHover={{ y: -4 }}
          className="relative rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-8 shadow-xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.03] via-purple-500/[0.03] to-pink-500/[0.03] pointer-events-none" />
          <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-gradient-to-br from-indigo-500/20 to-pink-500/20 blur-3xl pointer-events-none" />

          <span className="relative z-10 inline-flex px-4 py-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white text-xs font-semibold rounded-full mb-4 shadow-lg">
            Plan Único
          </span>

          <h2 className="relative z-10 text-3xl font-bold">Precio Único</h2>

          <p className="relative z-10 mt-6">
            <span className="text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              $39.990
            </span>
            <span className="text-lg font-normal text-muted-foreground">/mes</span>
          </p>

          <p className="relative z-10 mt-2 text-sm text-muted-foreground">
            Todo incluido. Sin cargos ocultos.
          </p>

          <ul className="relative z-10 mt-6 space-y-3 text-left max-w-xs mx-auto">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm">
                <div className="h-4 w-4 rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 flex items-center justify-center shrink-0">
                  <CheckIcon className="h-3 w-3 text-white" />
                </div>
                {f}
              </li>
            ))}
          </ul>

          <div className="relative z-10 mt-8">
            <Button size="lg" className="w-full gap-2 group" asChild>
              <Link href="/signup">
                Quiero mi sistema
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
