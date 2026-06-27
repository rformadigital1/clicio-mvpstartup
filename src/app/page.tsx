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
      <header className="fixed top-0 z-50 w-full border-b border-border/20 bg-background/90 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img src="/logo-small.webp" alt="CLICIO" className="h-9 w-auto object-contain" />
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#solucion" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Solución
            </Link>
            <Link href="#precio" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Precio
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/signin" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">
              Acceder
            </Link>
            <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20" asChild>
              <Link href="/signup">
                Comenzar
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <HeroSection />
        <FeaturesSection />
        <TestimonialsSection />
        <PricingSection />
        <CTASection />
      </main>

      <footer className="border-t border-border/20 py-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col items-center gap-4">
            <Link href="/" className="flex items-center group">
              <img src="/logo-small.webp" alt="CLICIO" className="h-8 w-auto object-contain" />
            </Link>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} CLICIO. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
