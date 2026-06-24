import Link from "next/link"
import { Button } from "@/components/ui/button"
import { HeroSection } from "@/components/landing/hero-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { TestimonialsSection } from "@/components/landing/testimonials-section"
import { PricingSection } from "@/components/landing/pricing-section"
import { CTASection } from "@/components/landing/cta-section"

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden">
      <header className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 transition-shadow">
        <div className="container mx-auto flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center">
              <span className="text-xs font-bold text-white">C</span>
            </div>
            <span className="text-lg font-bold tracking-tight">CLICIO</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#solucion" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Solución</Link>
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

        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/[0.02] to-transparent pointer-events-none" />
          <FeaturesSection />
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/[0.02] to-transparent pointer-events-none" />
          <TestimonialsSection />
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/[0.02] to-transparent pointer-events-none" />
          <PricingSection />
        </div>

        <CTASection />
      </main>

      <footer className="border-t border-border/50 py-10 text-center text-sm text-muted-foreground">
        <div className="container mx-auto">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center">
              <span className="text-[8px] font-bold text-white">C</span>
            </div>
            <span className="font-bold text-foreground">CLICIO</span>
          </div>
          <p>&copy; 2026 CLICIO. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
