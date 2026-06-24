import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckIcon } from "@/components/icons/whatsapp"
import { Globe, Calendar, Award, Star, Users, TrendingUp, Clock } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="fixed top-0 z-50 w-full border-b border-border-subtil bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-shadow">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
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
        <section className="container pt-32 pb-20 text-center animate-fade-in">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-azul-rey/20 bg-azul-rey/5 text-azul-rey text-xs font-medium mb-6">
            <Clock className="h-3 w-3" />
            Nuevo — Sistema de fidelización incluido
          </div>
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center text-left">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
                Más clientes.
                <br />
                Más reservas.
                <br />
                <span className="text-azul-rey">Más recompra.</span>
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Todo desde una sola plataforma. Web profesional, agenda online, gestión de clientes y fidelización digital para tu taller.
              </p>
              <div className="mt-6 flex gap-4">
                <Button size="lg" asChild>
                  <Link href="/signup">Solicitar Demo</Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <a href="#solucion">Conocer más</a>
                </Button>
              </div>
              <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-green-600" /> +40% reservas</span>
                <span className="flex items-center gap-1"><Users className="h-3 w-3 text-azul-rey" /> +50 talleres</span>
              </div>
            </div>
            <div className="hidden md:block relative">
              <div className="aspect-[4/3] rounded-xl border border-border-subtil bg-gradient-to-br from-azul-rey/5 to-celeste-cielo/5 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-16 h-16 rounded-full bg-azul-rey/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-azul-rey">C</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Dashboard en vivo</p>
                  <p className="text-xs text-muted-foreground mt-1">Gestiona tu taller desde cualquier lugar</p>
                </div>
              </div>
              <div className="absolute -bottom-3 -right-3 w-24 h-24 bg-azul-rey/5 rounded-full blur-2xl" />
            </div>
          </div>
        </section>

        <section id="problema" className="border-t py-20 animate-fade-in">
          <div className="container max-w-2xl text-center">
            <span className="text-xs font-semibold text-azul-rey uppercase tracking-wider">El problema</span>
            <h2 className="text-3xl font-bold mt-2">Tu taller pierde clientes cada semana.</h2>
            <p className="mt-4 text-muted-foreground">
              Sin página web, sin agenda ordenada, sin sistema de fidelización. Dependes solo del boca a boca y pierdes ventas todos los días.
            </p>
          </div>
        </section>

        <section id="solucion" className="border-t py-20 bg-muted/50">
          <div className="container max-w-4xl">
            <div className="text-center mb-12">
              <span className="text-xs font-semibold text-azul-rey uppercase tracking-wider">La solución</span>
              <h2 className="text-3xl font-bold mt-2">Web + Agenda + Fidelización</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Globe, title: "Web Profesional", desc: "Sitio web optimizado para Google, adaptado a móviles, con tu información y servicios." },
                { icon: Calendar, title: "Agenda Online", desc: "Tus clientes reservan desde tu web. Recibes confirmaciones y recordatorios automáticos." },
                { icon: Award, title: "Fidelización Digital", desc: "Programa de sellos tipo cafetería. Cada servicio = 1 sello. Premia la recompra." },
              ].map((item, i) => (
                <div key={item.title} className="rounded-xl border border-border-subtil bg-card p-6 text-center hover:bg-white hover:border-border-medio transition-all duration-200 animate-fade-in-up" style={{ animationDelay: `${(i + 1) * 100}ms` }}>
                  <div className="w-10 h-10 rounded-lg bg-azul-rey/10 flex items-center justify-center mx-auto mb-4">
                    <item.icon className="h-5 w-5 text-azul-rey" />
                  </div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="beneficios" className="border-t py-20">
          <div className="container max-w-4xl">
            <div className="text-center mb-12">
              <span className="text-xs font-semibold text-azul-rey uppercase tracking-wider">Beneficios</span>
              <h2 className="text-3xl font-bold mt-2">Por qué elegir CLICIO</h2>
            </div>
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { icon: TrendingUp, text: "Más clientes", desc: "Capta clientes con web profesional" },
                { icon: Calendar, text: "Más reservas", desc: "Agenda online 24/7" },
                { icon: Users, text: "Más organización", desc: "CRM simple y potente" },
                { icon: Award, text: "Más recompra", desc: "Fidelización automática" },
              ].map((b, i) => (
                <div key={b.text} className="rounded-xl border border-border-subtil bg-card p-5 text-center hover:bg-white hover:border-border-medio transition-all duration-200 animate-fade-in-up" style={{ animationDelay: `${(i + 1) * 100}ms` }}>
                  <div className="w-9 h-9 rounded-lg bg-azul-rey/10 flex items-center justify-center mx-auto mb-3">
                    <b.icon className="h-4 w-4 text-azul-rey" />
                  </div>
                  <p className="font-semibold text-sm">{b.text}</p>
                  <p className="text-xs text-muted-foreground mt-1">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonios */}
        <section className="border-t py-20 bg-muted/50">
          <div className="container max-w-4xl">
            <div className="text-center mb-10">
              <span className="text-xs font-semibold text-azul-rey uppercase tracking-wider">Testimonios</span>
              <h2 className="text-3xl font-bold mt-2">Lo que dicen los talleres</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { name: "Carlos M.", workshop: "Taller Mecánico Pérez", text: "Desde que uso CLICIO, las reservas llegaron solas. Ya no pierdo llamadas perdidas." },
                { name: "Andrea L.", workshop: "Auto Servicio La Vega", text: "La fidelización es un antes y después. Mis clientes vuelven por los sellos." },
                { name: "Pedro G.", workshop: "Gomería Express", text: "En 15 minutos tenía mi página lista. Mis clientes agendan solos." },
              ].map((t, i) => (
                <div key={t.name} className="rounded-xl border border-border-subtil bg-card p-6 animate-fade-in-up" style={{ animationDelay: `${(i + 1) * 100}ms` }}>
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">"{t.text}"</p>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.workshop}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="precio" className="border-t py-20">
          <div className="container max-w-md">
            <div className="rounded-xl border-2 border-azul-rey/30 bg-gradient-to-b from-azul-rey/[0.03] to-transparent p-8 text-center relative">
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-azul-rey text-white text-xs font-semibold rounded-full">Plan Único</span>
              <h2 className="text-3xl font-bold mt-2">Precio Único</h2>
              <p className="mt-6 text-5xl font-bold">$39.990 <span className="text-lg font-normal text-muted-foreground">/mes</span></p>
              <p className="mt-2 text-sm text-muted-foreground">Todo incluido. Sin cargos ocultos.</p>
              <ul className="mt-6 space-y-3 text-left">
                {["Página web profesional", "Hosting incluido", "Agenda online", "CRM básico", "WhatsApp automatizado", "Sistema de fidelización"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckIcon className="h-4 w-4 text-azul-rey shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button size="lg" className="mt-6 w-full" asChild>
                <Link href="/signup">Quiero mi sistema</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="border-t py-20 bg-muted/50 text-center">
          <div className="container max-w-xl">
            <h2 className="text-2xl font-bold">Comienza hoy</h2>
            <p className="mt-4 text-muted-foreground">En menos de 15 minutos tu taller tiene presencia profesional en internet.</p>
            <div className="mt-6 flex gap-3 justify-center">
              <Button size="lg" asChild>
                <Link href="/signup">Solicitar Demo</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="#solucion">Ver más</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <div className="container">
          <p>© 2026 CLICIO. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
