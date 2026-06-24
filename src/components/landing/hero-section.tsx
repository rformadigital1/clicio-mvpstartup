"use client"

import * as React from "react"
import { motion, type Variants } from "framer-motion"
import { ChevronRight, Calendar, Users, Clock, Star } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type AnimatedGroupProps = {
  children: React.ReactNode
  className?: string
  variants?: {
    container?: Variants
    item?: Variants
  }
}

const defaultContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const defaultItemVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

function AnimatedGroup({ children, className, variants }: AnimatedGroupProps) {
  const containerVariants = variants?.container || defaultContainerVariants
  const itemVariants = variants?.item || defaultItemVariants

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={cn(className)}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}

const transitionVariants = {
  item: {
    hidden: { opacity: 0, filter: "blur(12px)", y: 12 },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: { type: "spring", bounce: 0.3, duration: 1.5 } as const,
    },
  },
} satisfies { item: Variants }

function GetStartedButton() {
  return (
    <Button className="group relative overflow-hidden" size="lg" asChild>
      <Link href="/signup">
        <span className="mr-8 transition-opacity duration-500 group-hover:opacity-0">
          Get Started
        </span>
        <i className="absolute right-1 top-1 bottom-1 rounded-sm z-10 grid w-1/4 place-items-center transition-all duration-500 bg-primary-foreground/15 group-hover:w-[calc(100%-0.5rem)] group-active:scale-95">
          <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
        </i>
      </Link>
    </Button>
  )
}

const PhoneMockup = () => {
  return (
    <div className="relative mx-auto w-[280px] sm:w-[320px]">
      <div className="relative rounded-[2.5rem] border-[8px] border-gray-800 bg-gray-800 shadow-2xl">
        <div className="absolute left-1/2 top-0 h-6 w-32 -translate-x-1/2 rounded-b-2xl bg-gray-800"></div>
        <div className="overflow-hidden rounded-[2rem] bg-white">
          <div className="h-[580px] sm:h-[640px] overflow-y-auto">
            <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4 text-white">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-lg font-bold">CLICIO</div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-medium">
                    JD
                  </div>
                </div>
              </div>
              <h2 className="text-xl font-bold mb-1">Panel de Control</h2>
              <p className="text-xs text-white/80">Gestiona tus citas y servicios</p>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border bg-gradient-to-br from-indigo-50 to-indigo-100 p-3">
                  <Calendar className="h-5 w-5 text-indigo-600 mb-2" />
                  <div className="text-2xl font-bold text-indigo-900">24</div>
                  <div className="text-xs text-indigo-600">Citas Hoy</div>
                </div>
                <div className="rounded-xl border border-border bg-gradient-to-br from-purple-50 to-purple-100 p-3">
                  <Users className="h-5 w-5 text-purple-600 mb-2" />
                  <div className="text-2xl font-bold text-purple-900">156</div>
                  <div className="text-xs text-purple-600">Clientes</div>
                </div>
              </div>
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">Próximas Citas</h3>
                  <button className="text-xs text-indigo-600 font-medium">Ver todas</button>
                </div>
                <div className="space-y-2">
                  <div className="rounded-lg border border-border bg-white p-3 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-semibold text-indigo-700">MC</div>
                        <div>
                          <div className="text-xs font-semibold text-gray-900">María Contreras</div>
                          <div className="text-[10px] text-gray-500">Corte de cabello</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-semibold text-gray-900">10:00</div>
                        <div className="text-[10px] text-gray-500">45 min</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 rounded-md bg-indigo-600 px-2 py-1.5 text-[10px] font-medium text-white">Confirmar</button>
                      <button className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-[10px] font-medium text-gray-700">Reagendar</button>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-white p-3 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-xs font-semibold text-purple-700">JR</div>
                        <div>
                          <div className="text-xs font-semibold text-gray-900">Juan Rodríguez</div>
                          <div className="text-[10px] text-gray-500">Masaje terapéutico</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-semibold text-gray-900">11:30</div>
                        <div className="text-[10px] text-gray-500">60 min</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 rounded-md bg-indigo-600 px-2 py-1.5 text-[10px] font-medium text-white">Confirmar</button>
                      <button className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-[10px] font-medium text-gray-700">Reagendar</button>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-white p-3 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-pink-100 flex items-center justify-center text-xs font-semibold text-pink-700">AS</div>
                        <div>
                          <div className="text-xs font-semibold text-gray-900">Ana Silva</div>
                          <div className="text-[10px] text-gray-500">Manicure y pedicure</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-semibold text-gray-900">14:00</div>
                        <div className="text-[10px] text-gray-500">90 min</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 rounded-md bg-indigo-600 px-2 py-1.5 text-[10px] font-medium text-white">Confirmar</button>
                      <button className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-[10px] font-medium text-gray-700">Reagendar</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface StatCardProps {
  icon: React.ReactNode
  value: string
  label: string
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, label }) => {
  return (
    <div className="rounded-2xl border border-border bg-background/50 backdrop-blur-sm p-6 text-center">
      <div className="mb-3 flex justify-center">{icon}</div>
      <div className="mb-1 text-3xl font-bold text-foreground">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  )
}

export function HeroSection() {
  return (
    <main className="relative overflow-hidden bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/10 via-purple-500/5 to-transparent"></div>

      <section className="relative">
        <div className="mx-auto max-w-7xl px-6 pt-20 pb-16 lg:pt-32 lg:pb-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <AnimatedGroup
              variants={{
                container: {
                  visible: {
                    transition: {
                      staggerChildren: 0.1,
                      delayChildren: 0.2,
                    },
                  },
                },
                ...transitionVariants,
              }}
              className="space-y-8"
            >
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/50 px-4 py-2 text-sm backdrop-blur-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500"></span>
                  </span>
                  <span className="text-muted-foreground">Now Live</span>
                </div>

                <h1 className="text-balance text-4xl font-bold sm:text-5xl md:text-6xl lg:text-7xl">
                  <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Book Services
                  </span>
                  <br />
                  <span className="text-foreground">In Seconds</span>
                </h1>

                <p className="max-w-xl text-lg text-muted-foreground">
                  La forma más rápida de agendar citas con tus proveedores de servicios favoritos.
                  Simple, elegante y diseñado para negocios modernos.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <GetStartedButton />
                <Button variant="outline" size="lg" asChild>
                  <Link href="#solucion">Ver Demo</Link>
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-8">
                <StatCard
                  icon={<Users className="h-8 w-8 text-indigo-600" />}
                  value="50K+"
                  label="Usuarios Activos"
                />
                <StatCard
                  icon={<Calendar className="h-8 w-8 text-purple-600" />}
                  value="1M+"
                  label="Reservas"
                />
                <StatCard
                  icon={<Star className="h-8 w-8 text-pink-600" />}
                  value="4.9"
                  label="Calificación"
                />
              </div>
            </AnimatedGroup>

            <AnimatedGroup
              variants={{
                container: {
                  visible: {
                    transition: {
                      staggerChildren: 0.15,
                      delayChildren: 0.4,
                    },
                  },
                },
                ...transitionVariants,
              }}
              className="relative"
            >
              <div className="relative">
                <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-3xl"></div>
                <div className="relative">
                  <PhoneMockup />
                </div>
              </div>
            </AnimatedGroup>
          </div>
        </div>
      </section>

      <section className="relative border-t border-border bg-background/50 py-12 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
            <div className="text-center md:text-left">
              <p className="text-sm font-medium text-muted-foreground">
                Confiado por empresas líderes
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-60 grayscale">
              <div className="text-2xl font-bold">Acme Co</div>
              <div className="text-2xl font-bold">TechCorp</div>
              <div className="text-2xl font-bold">StyleHub</div>
              <div className="text-2xl font-bold">WellnessPlus</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
