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
      <header className="fixed top-0 z-50 w-full border-b border-border/30 bg-background/70 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow duration-300">
              <span className="text-sm font-bold text-white">C</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">CLICIO</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#solucion" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-gradient-to-r after:from-indigo-500 after:to-pink-500 after:transition-all hover:after:w-full">
              Solución
            </Link>
            <Link href="#precio" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-gradient-to-r after:from-indigo-500 after:to-pink-500 after:transition-all hover:after:w-full">
              Precio
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/signin" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 hidden sm:inline">
              Acceder
            </Link>
            <Button className="relative overflow-hidden group" asChild>
              <Link href="/signup">
                <span className="relative z-10">Solicitar Demo</span>
                <span className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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

      <footer className="border-t border-border/30 py-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col items-center gap-4">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-md">
                <span className="text-[9px] font-bold text-white">C</span>
              </div>
              <span className="font-bold text-foreground">CLICIO</span>
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
