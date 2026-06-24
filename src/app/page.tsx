import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckIcon } from "@/components/icons/whatsapp"
import { Globe, Calendar, Award, Star, TrendingUp, ArrowRight, Zap, Shield, Smartphone } from "lucide-react"
import { HeroSection } from "@/components/landing/hero-section"

function DecorativeBlob({ className, variant = "blue" }: { className?: string; variant?: "blue" | "dark" | "red" | "amber" }) {
  const cls = variant === "blue" ? "blob-blue" : variant === "dark" ? "blob-dark" : variant === "red" ? "blob-red" : "blob-amber"
  return <div className={`${cls} ${className ?? ""}`} />
}

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden">
      {/* Global decorative blobs */}
      <DecorativeBlob className="fixed top-40 -left-32 w-80 h-80 opacity-60 pointer-events-none" variant="blue" />
      <DecorativeBlob className="fixed top-96 -right-40 w-96 h-96 opacity-40 pointer-events-none" variant="dark" />
      <DecorativeBlob className="fixed bottom-40 left-1/3 w-72 h-72 opacity-30 pointer-events-none" variant="red" />
      <DecorativeBlob className="fixed bottom-96 right-1/4 w-64 h-64 opacity-30 pointer-events-none" variant="amber" />

      <header className="fixed top-0 z-50 w-full border-b border-border-subtil bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 transition-shadow">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-azul-rey to-celeste-cielo flex items-center justify-center">
              <span className="text-xs font-bold text-white">C</span>
            </div>
            <span className="text-lg font-bold tracking-tight">CLICIO</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#problema" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Problema</Link>
            <Link href="#solucion" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Solución</Link>
            <Link href="#beneficios" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Beneficios</Link>
            <Link href="#precio" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Precio</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/signin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Acceder</Link>
            <Button asChild>
              <Link href="/signup">Solicitar Demo</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <HeroSection />

        {/* ── Problema ── */}
        <section id="problema" className="relative py-24">
          <DecorativeBlob className="absolute top-10 left-10 w-40 h-40 opacity-50" variant="dark" />
          <div className="container relative z-10 max-w-2xl text-center">
            <span className="text-xs font-semibold text-azul-rey uppercase tracking-[0.2em]">El problema</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-3 leading-tight">
              Tu taller pierde clientes <span className="text-azul-rey">cada semana</span>.
            </h2>
            <div className="mt-6 mx-auto w-16 h-0.5 rounded-full bg-gradient-to-r from-azul-rey to-celeste-cielo" />
            <p className="mt-6 text-muted-foreground text-lg leading-relaxed max-w-lg mx-auto">
              Sin página web, sin agenda ordenada, sin sistema de fidelización. Dependes solo del boca a boca y pierdes ventas todos los días.
            </p>
          </div>
        </section>

        {/* ── Solución (Bento Grid) ── */}
        <section id="solucion" className="relative py-24 bg-muted/30">
          <DecorativeBlob className="absolute top-20 right-0 w-60 h-60 opacity-40" variant="blue" />
          <DecorativeBlob className="absolute bottom-20 left-0 w-48 h-48 opacity-30" variant="red" />
          <div className="container relative z-10 max-w-5xl">
            <div className="text-center mb-14">
              <span className="text-xs font-semibold text-azul-rey uppercase tracking-[0.2em]">La solución</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-3">Web + Agenda + Fidelización</h2>
              <p className="mt-3 text-muted-foreground max-w-md mx-auto">
                Todo lo que necesitas para digitalizar tu taller en un solo lugar
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="group md:col-span-2 md:row-span-2 rounded-2xl border border-border-subtil bg-card p-8 card-lift hover:border-azul-rey/30 cursor-pointer animate-fade-in-up relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-azul-rey/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-azul-rey/20 to-celeste-cielo/20 flex items-center justify-center mb-5">
                  <Globe className="h-6 w-6 text-azul-rey" />
                </div>
                <h3 className="text-xl font-bold mb-3">Web Profesional</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Sitio web optimizado para Google, adaptado a móviles, con tu información, servicios y galería de trabajos.
                </p>
                <ul className="mt-5 space-y-2">
                  {["Dominio personalizado", "Optimizado SEO local", "Galería de trabajos"].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckIcon className="h-3.5 w-3.5 text-azul-rey shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="group md:col-span-2 rounded-2xl border border-border-subtil bg-card p-6 card-lift hover:border-celeste-cielo/30 cursor-pointer animate-fade-in-up animation-delay-100 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-celeste-cielo/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-celeste-cielo/20 to-azul-rey/20 flex items-center justify-center mb-4">
                  <Calendar className="h-5 w-5 text-celeste-cielo" />
                </div>
                <h3 className="font-bold mb-2">Agenda Online</h3>
                <p className="text-sm text-muted-foreground">Tus clientes reservan desde tu web. Recibes confirmaciones y recordatorios automáticos.</p>
              </div>
              <div className="group rounded-2xl border border-border-subtil bg-card p-6 card-lift hover:border-amber-400/30 cursor-pointer animate-fade-in-up animation-delay-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-400/20 flex items-center justify-center mb-4">
                  <Zap className="h-5 w-5 text-amber-500" />
                </div>
                <h3 className="font-bold mb-2">Notificaciones</h3>
                <p className="text-sm text-muted-foreground">Recordatorios automáticos por WhatsApp. Menos ausencias, más clientes.</p>
              </div>
              <div className="group rounded-2xl border border-border-subtil bg-card p-6 card-lift hover:border-green-400/30 cursor-pointer animate-fade-in-up animation-delay-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-400/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400/20 to-emerald-400/20 flex items-center justify-center mb-4">
                  <Smartphone className="h-5 w-5 text-green-500" />
                </div>
                <h3 className="font-bold mb-2">Panel Móvil</h3>
                <p className="text-sm text-muted-foreground">Gestiona tu taller desde el celular. Dashboard responsive con todo al alcance.</p>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border-subtil to-transparent" />
        </section>

        {/* ── Beneficios ── */}
        <section id="beneficios" className="relative py-24">
          <DecorativeBlob className="absolute top-0 right-1/3 w-56 h-56 opacity-30" variant="blue" />
          <div className="container relative z-10 max-w-5xl">
            <div className="text-center mb-14">
              <span className="text-xs font-semibold text-azul-rey uppercase tracking-[0.2em]">Beneficios</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-3">Por qué elegir CLICIO</h2>
            </div>
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { icon: TrendingUp, text: "Más clientes", desc: "Capta clientes con web profesional", color: "azul-rey" },
                { icon: Calendar, text: "Más reservas", desc: "Agenda online 24/7", color: "celeste-cielo" },
                { icon: Shield, text: "Más organización", desc: "CRM simple y potente", color: "green" },
                { icon: Award, text: "Más recompra", desc: "Fidelización automática", color: "amber" },
              ].map((b, i) => {
                const gradientMap: Record<string, string> = {
                  "azul-rey": "from-azul-rey/20 to-celeste-cielo/20",
                  "celeste-cielo": "from-celeste-cielo/20 to-azul-rey/20",
                  "green": "from-green-400/20 to-emerald-400/20",
                  "amber": "from-amber-400/20 to-orange-400/20",
                }
                return (
                  <div key={b.text} className="group rounded-xl border border-border-subtil bg-card p-6 text-center card-lift cursor-pointer animate-fade-in-up" style={{ animationDelay: `${(i + 1) * 100}ms` }}>
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradientMap[b.color]} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <b.icon className="h-5 w-5" style={{ color: `var(--color-${b.color === "green" ? "green" : b.color === "amber" ? "amber" : b.color.includes("azul") ? "azul-rey" : "celeste-cielo"})` }} />
                    </div>
                    <p className="font-semibold">{b.text}</p>
                    <p className="text-xs text-muted-foreground mt-1.5">{b.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border-subtil to-transparent" />
        </section>

        {/* ── Testimonios ── */}
        <section className="relative py-24 bg-muted/30">
          <DecorativeBlob className="absolute top-10 left-1/4 w-52 h-52 opacity-40" variant="amber" />
          <DecorativeBlob className="absolute bottom-10 right-1/4 w-44 h-44 opacity-30" variant="blue" />
          <div className="container relative z-10 max-w-5xl">
            <div className="text-center mb-14">
              <span className="text-xs font-semibold text-azul-rey uppercase tracking-[0.2em]">Testimonios</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-3">Lo que dicen los talleres</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {[
                { name: "Carlos M.", workshop: "Taller Mecánico Pérez", text: "Desde que uso CLICIO, las reservas llegaron solas. Ya no pierdo llamadas perdidas." },
                { name: "Andrea L.", workshop: "Auto Servicio La Vega", text: "La fidelización es un antes y después. Mis clientes vuelven por los sellos." },
                { name: "Pedro G.", workshop: "Gomería Express", text: "En 15 minutos tenía mi página lista. Mis clientes agendan solos." },
              ].map((t, i) => (
                <div key={t.name} className="group relative rounded-xl border border-border-subtil bg-card p-6 card-lift animate-fade-in-up" style={{ animationDelay: `${(i + 1) * 100}ms` }}>
                  <div className="absolute -top-2 -left-2 text-4xl leading-none text-azul-rey/10 font-serif pointer-events-none">&ldquo;</div>
                  <div className="flex items-center gap-0.5 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-5 leading-relaxed relative z-10">&ldquo;{t.text}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-azul-rey to-celeste-cielo rounded-full blur-md opacity-60 group-hover:opacity-100 transition-opacity" />
                      <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-azul-rey to-celeste-cielo flex items-center justify-center text-[10px] font-bold text-white">
                        {t.name.charAt(0)}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.workshop}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border-subtil to-transparent" />
        </section>

        {/* ── Precio ── */}
        <section id="precio" className="relative py-24">
          <DecorativeBlob className="absolute top-20 left-1/3 w-64 h-64 opacity-40" variant="dark" />
          <div className="container relative z-10 max-w-md">
            <div className="relative rounded-2xl border-2 border-azul-rey/20 bg-gradient-to-b from-white dark:from-zinc-800 to-card p-8 text-center shadow-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-azul-rey/[0.03] to-transparent pointer-events-none" />
              <span className="relative z-10 inline-flex px-4 py-1 bg-azul-rey text-white text-xs font-semibold rounded-full mb-4">Plan Único</span>
              <h2 className="relative z-10 text-3xl font-bold">Precio Único</h2>
              <p className="relative z-10 mt-6">
                <span className="text-5xl font-bold">$39.990</span>
                <span className="text-lg font-normal text-muted-foreground">/mes</span>
              </p>
              <p className="relative z-10 mt-2 text-sm text-muted-foreground">Todo incluido. Sin cargos ocultos.</p>
              <ul className="relative z-10 mt-6 space-y-3 text-left max-w-xs mx-auto">
                {["Página web profesional", "Hosting incluido", "Agenda online", "CRM básico", "WhatsApp automatizado", "Sistema de fidelización"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckIcon className="h-4 w-4 text-azul-rey shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="relative z-10 mt-8">
                <Button size="lg" className="w-full gap-2 shine-overlay" asChild>
                  <Link href="/signup">Quiero mi sistema <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="relative py-24 bg-muted/30 dots-bg overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(74,144,217,0.08)_0%,transparent_70%)] pointer-events-none" />
          <div className="container relative z-10 max-w-xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold">Comienza hoy</h2>
            <p className="mt-4 text-muted-foreground text-lg">En menos de 15 minutos tu taller tiene presencia profesional en internet.</p>
            <div className="mt-8 flex gap-3 justify-center">
              <Button size="lg" className="gap-2 shine-overlay" asChild>
                <Link href="/signup">Solicitar Demo <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="#solucion">Ver más</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-10 text-center text-sm text-muted-foreground">
        <div className="container">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-azul-rey to-celeste-cielo flex items-center justify-center">
              <span className="text-[8px] font-bold text-white">C</span>
            </div>
            <span className="font-bold text-foreground">CLICIO</span>
          </div>
          <p>© 2026 CLICIO. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
