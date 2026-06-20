import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="fixed top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="text-xl font-bold">CLICIO</Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#problema" className="text-sm text-muted-foreground hover:text-foreground">Problema</Link>
            <Link href="#solucion" className="text-sm text-muted-foreground hover:text-foreground">Solución</Link>
            <Link href="#beneficios" className="text-sm text-muted-foreground hover:text-foreground">Beneficios</Link>
            <Link href="#precio" className="text-sm text-muted-foreground hover:text-foreground">Precio</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/signin" className="text-sm text-muted-foreground hover:text-foreground">Acceder</Link>
            <Button asChild>
              <Link href="/signup">Solicitar Demo</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="container pt-32 pb-20 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Más clientes.
            <br />
            Más reservas.
            <br />
            Más recompra.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
            Todo desde una sola plataforma. Web profesional, agenda online, gestión de clientes y fidelización digital para tu taller.
          </p>
          <div className="mt-8 flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/signup">Solicitar Demo</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="#solucion">Conocer más</a>
            </Button>
          </div>
        </section>

        <section id="problema" className="border-t py-20">
          <div className="container max-w-2xl text-center">
            <h2 className="text-3xl font-bold">Tu taller pierde clientes cada semana.</h2>
            <p className="mt-4 text-muted-foreground">
              Sin página web, sin agenda ordenada, sin sistema de fidelización. Dependes solo del boca a boca y pierdes ventas todos los días.
            </p>
          </div>
        </section>

        <section id="solucion" className="border-t py-20">
          <div className="container max-w-4xl">
            <h2 className="text-3xl font-bold text-center mb-12">Web + Agenda + Fidelización</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { title: "Web Profesional", desc: "Sitio web optimizado para Google, adaptado a móviles, con tu información y servicios." },
                { title: "Agenda Online", desc: "Tus clientes reservan desde tu web. Recibes confirmaciones y recordatorios automáticos." },
                { title: "Fidelización Digital", desc: "Programa de sellos tipo cafetería. Cada servicio = 1 sello. Premia la recompra." },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border p-6 text-center">
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="beneficios" className="border-t py-20 bg-muted/50">
          <div className="container max-w-4xl">
            <h2 className="text-3xl font-bold text-center mb-12">Beneficios</h2>
            <div className="grid md:grid-cols-4 gap-6">
              {["Más clientes", "Más reservas", "Más organización", "Más recompra"].map((b) => (
                <div key={b} className="rounded-xl border bg-card p-6 text-center font-semibold">{b}</div>
              ))}
            </div>
          </div>
        </section>

        <section id="precio" className="border-t py-20">
          <div className="container max-w-md text-center">
            <h2 className="text-3xl font-bold">Precio Único</h2>
            <p className="mt-8 text-5xl font-bold">$39.990 <span className="text-lg font-normal text-muted-foreground">/mes</span></p>
            <p className="mt-2 text-sm text-muted-foreground">Todo incluido. Sin cargos ocultos.</p>
            <ul className="mt-8 space-y-3 text-left">
              {["Página web profesional", "Hosting incluido", "Agenda online", "CRM básico", "WhatsApp automatizado", "Sistema de fidelización"].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="text-primary">✓</span> {f}
                </li>
              ))}
            </ul>
            <Button size="lg" className="mt-8 w-full" asChild>
              <Link href="/signup">Quiero mi sistema</Link>
            </Button>
          </div>
        </section>

        <section className="border-t py-20 bg-muted/50 text-center">
          <div className="container max-w-xl">
            <h2 className="text-2xl font-bold">Comienza hoy</h2>
            <p className="mt-4 text-muted-foreground">En menos de 15 minutos tu taller tiene presencia profesional en internet.</p>
            <Button size="lg" className="mt-8" asChild>
              <Link href="/signup">Solicitar Demo</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <div className="container">© 2026 CLICIO. Todos los derechos reservados.</div>
      </footer>
    </div>
  )
}
