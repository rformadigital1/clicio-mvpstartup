"use client"

import { motion } from "framer-motion"
import { Check, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const features = [
  "Página web profesional con tu taller",
  "Reservas online 24/7 sin llamadas",
  "Registro de clientes y vehículos",
  "WhatsApp automatizado",
  "Separación de cuentas del taller",
  "Respuesta por WhatsApp en minutos",
]

export function PricingSection() {
  return (
    <section id="precio" className="relative py-28 overflow-hidden">
      <div className="absolute top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-indigo-500/5 blur-[150px] pointer-events-none" />

      <div className="container mx-auto relative z-10 max-w-md px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            <span className="text-foreground">Plan único.</span>{" "}
            <span className="text-indigo-600 dark:text-indigo-400">Sin sorpresas.</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15, type: "spring", bounce: 0.25, duration: 1.2 }}
          whileHover={{ y: -4 }}
          className="relative rounded-2xl border border-border/30 bg-card/80 p-8 shadow-xl overflow-hidden"
        >
          <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />

          <div className="relative z-10 text-center">
            <span className="inline-flex px-4 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-full mb-5 shadow-md">
              Plan Único
            </span>

            <div className="mt-6">
              <span className="text-6xl font-bold text-foreground">
                $24.990
              </span>
              <span className="text-lg font-normal text-muted-foreground ml-2">/mes</span>
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              Todo incluido. Sin cargos ocultos. Cancela cuando quieras.
            </p>
          </div>

          <div className="relative z-10 mt-8">
            <div className="border-t border-border/20 my-6" />
            <ul className="space-y-3.5">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm">
                  <div className="h-5 w-5 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  </div>
                  <span className="text-foreground/90">{f}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative z-10 mt-8">
            <Button size="lg" className="w-full gap-2 group relative overflow-hidden shadow-lg shadow-indigo-500/20" asChild>
              <Link href="/signup">
                <span className="relative z-10">Pruébalo 14 días gratis</span>
                <ArrowRight className="h-4 w-4 relative z-10 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-3">
              Sin tarjeta de crédito. Sin compromiso.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
