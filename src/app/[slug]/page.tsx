"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Tenant, Service, BusinessHour, GalleryImage, PageConfig } from "@/lib/types"
import { TEMPLATES, derivePalette } from "@/lib/templates"
import type { TemplateId } from "@/lib/templates"
import { WhatsAppIcon } from "@/components/icons/whatsapp"
import { BookingWizard } from "@/components/booking/booking-wizard"

function getFontPreset(templateId: TemplateId, fontPresetId: string) {
  const template = TEMPLATES[templateId] ?? TEMPLATES.classic
  return template.fontPresets.find((f) => f.id === fontPresetId) ?? template.fontPresets[0]
}

const DEFAULT_CONFIG: PageConfig = {
  template: "classic",
  primaryColor: TEMPLATES.classic.basePalette.primary,
  fontPreset: TEMPLATES.classic.fontPresets[0].id,
  sections: [
    { id: "quick-buttons", visible: true, order: 0 },
    { id: "services", visible: true, order: 1 },
    { id: "booking-wizard", visible: true, order: 2 },
    { id: "gallery", visible: true, order: 3 },
    { id: "map", visible: true, order: 4 },
  ],
  buttons: {
    whatsapp: { visible: true, label: "WhatsApp" },
    instagram: { visible: true, label: "Instagram" },
    servicios: { visible: true, label: "Servicios" },
    agendar: { visible: true, label: "Agendar Ahora" },
  },
}

export default function TenantSitePage() {
  const { slug } = useParams<{ slug: string }>()
  const supabase = createClient()
  const servicesRef = useRef<HTMLDivElement>(null)
  const wizardRef = useRef<HTMLDivElement>(null)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [hours, setHours] = useState<BusinessHour[]>([])
  const [gallery, setGallery] = useState<GalleryImage[]>([])
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    loadTenant()
  }, [slug])

  async function loadTenant() {
    setLoading(true)
    const { data: tenants, error } = await supabase
      .from("tenants")
      .select("*")
      .eq("slug", slug)

    if (error || !tenants || tenants.length === 0) {
      setNotFound(true)
      setLoading(false)
      return
    }

    setTenant(tenants[0])
    const [svcRes, hoursRes, galRes] = await Promise.all([
      supabase.from("services").select("*").eq("tenant_id", tenants[0].id),
      supabase.from("business_hours").select("*").eq("tenant_id", tenants[0].id).order("day_of_week"),
      supabase.from("gallery_images").select("*").eq("tenant_id", tenants[0].id).order("created_at", { ascending: false }),
    ])
    setServices(svcRes.data ?? [])
    setHours(hoursRes.data ?? [])
    setGallery(galRes.data ?? [])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--page-bg)] flex items-center justify-center">
        <div className="text-center animate-pulse">
          <p className="text-[var(--page-primary)] font-[var(--page-heading-font)] italic text-xl">Cargando...</p>
        </div>
      </div>
    )
  }

  if (notFound || !tenant) {
    return (
      <div className="min-h-screen bg-[var(--page-bg)] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-5xl mb-4">🔧</p>
          <h1 className="text-2xl font-bold text-foreground mb-2">Taller no encontrado</h1>
          <p className="text-muted-foreground">El taller que buscas no existe o la URL es incorrecta.</p>
        </div>
      </div>
    )
  }

  const cleanPhone = tenant.phone?.replace(/[^0-9]/g, "")

  function migrateConfig(raw: any): PageConfig {
    if (raw?.template) return raw as PageConfig
    return {
      template: "classic" as TemplateId,
      primaryColor: raw?.colors?.primary ?? DEFAULT_CONFIG.primaryColor,
      fontPreset: raw?.fontPreset ?? DEFAULT_CONFIG.fontPreset,
      sections: raw?.sections ?? DEFAULT_CONFIG.sections,
      buttons: raw?.buttons ?? DEFAULT_CONFIG.buttons,
    }
  }

  const config = migrateConfig(tenant.page_config)
  const colors = derivePalette(config.template as TemplateId, config.primaryColor)
  const fonts = getFontPreset(config.template as TemplateId, config.fontPreset)

  const pageStyle = {
    "--page-primary": colors.primary,
    "--page-secondary": colors.secondary,
    "--page-accent": colors.accent,
    "--page-bg": colors.background,
    "--page-card-bg": colors.cardBg,
    "--page-text": colors.text,
    "--page-btn-bg": colors.buttonBg,
    "--page-btn-text": colors.buttonText,
    "--page-heading-font": fonts.headingFont,
    "--page-body-font": fonts.bodyFont,
  } as React.CSSProperties

  const sortedSections = [...config.sections].sort((a, b) => a.order - b.order)

  const quickButtonsSection = (
    <div className="space-y-3 mb-10">
        {config.buttons.whatsapp.visible && cleanPhone && (
        <a
          href={`https://wa.me/${cleanPhone}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 w-full bg-[var(--page-card-bg)] border border-border-subtil rounded-lg px-4 py-3 text-sm font-medium hover:border-[var(--page-primary)]/40 hover:shadow-sm transition-all"
        >
          <WhatsAppIcon className="h-5 w-5" />
          {config.buttons.whatsapp.label}
          <span className="ml-auto text-muted-foreground text-xs">↗</span>
        </a>
      )}
      {config.buttons.instagram.visible && tenant.instagram && (() => {
        const url = tenant.instagram.trim()
        const safe = url.startsWith("https://instagram.com/") || url.startsWith("https://www.instagram.com/") || url.startsWith("https://ig.me/")
        if (!safe) return null
        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 w-full bg-[var(--page-card-bg)] border border-border-subtil rounded-lg px-4 py-3 text-sm font-medium hover:border-[var(--page-primary)]/40 hover:shadow-sm transition-all"
          >
            <InstagramIcon />
            {config.buttons.instagram.label}
            <span className="ml-auto text-muted-foreground text-xs">↗</span>
          </a>
        )
      })()}
      {config.buttons.servicios.visible && (
        <button
          onClick={() => servicesRef.current?.scrollIntoView({ behavior: "smooth" })}
          className="flex items-center gap-3 w-full bg-[var(--page-card-bg)] border border-border-subtil rounded-lg px-4 py-3 text-sm font-medium hover:border-[var(--page-primary)]/40 hover:shadow-sm transition-all text-left"
        >
          <WrenchIcon />
          {config.buttons.servicios.label}
        </button>
      )}
      {config.buttons.agendar.visible && (
        <button
          onClick={() => wizardRef.current?.scrollIntoView({ behavior: "smooth" })}
          className="flex items-center gap-3 w-full bg-[var(--page-btn-bg)] text-[var(--page-btn-text)] border border-[var(--page-btn-bg)] rounded-lg px-4 py-3 text-sm font-semibold hover:bg-[var(--page-btn-bg)]/90 transition-all shadow-sm"
        >
          <CalendarIcon />
          {config.buttons.agendar.label}
        </button>
      )}
    </div>
  )

  const servicesSection = services.length > 0 ? (
    <section ref={servicesRef} id="servicios" className="py-8">
      <h3 className="text-lg font-[var(--page-heading-font)] italic font-bold text-[var(--page-primary)] mb-5 text-center">Servicios</h3>
      <div className="space-y-3">
        {services.map((s) => (
          <div key={s.id} className="bg-[var(--page-card-bg)] rounded-lg p-4 border border-border-subtil flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-sm">{s.name}</h4>
              {s.duration && <p className="text-xs text-muted-foreground">{s.duration} min</p>}
            </div>
            {s.price && <p className="text-sm font-bold text-[var(--page-primary)]">$ {s.price.toLocaleString("es-CL")}</p>}
          </div>
        ))}
      </div>
    </section>
  ) : null

  const bookingWizardSection = (
    <div ref={wizardRef} className="py-8">
      <BookingWizard tenant={tenant} services={services} businessHours={hours} />
    </div>
  )

  const gallerySection = gallery.length > 0 ? (
    <section className="py-8">
      <h3 className="text-lg font-[var(--page-heading-font)] italic font-bold text-[var(--page-primary)] mb-5 text-center">Trabajos Realizados</h3>
      <div className="grid grid-cols-2 gap-3">
        {gallery.map((img) => (
          <button key={img.id} onClick={() => setLightboxUrl(img.image_url)} className="aspect-square overflow-hidden rounded-lg border border-border-subtil group">
            <img src={img.image_url} alt={`Trabajo realizado por ${tenant.name}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          </button>
        ))}
      </div>
    </section>
  ) : null

  const mapSection = tenant.address ? (
    <section className="py-8">
      <h3 className="text-lg font-[var(--page-heading-font)] italic font-bold text-[var(--page-primary)] mb-5 text-center">Ubicación</h3>
      <div className="rounded-lg overflow-hidden border border-border-subtil">
        <iframe
          src={`https://maps.google.com/maps?q=${encodeURIComponent(tenant.address)}&output=embed`}
          className="w-full h-56"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </section>
  ) : null

  const sectionRenderers: Record<string, React.ReactNode> = {
    "quick-buttons": quickButtonsSection,
    "services": servicesSection,
    "booking-wizard": bookingWizardSection,
    "gallery": gallerySection,
    "map": mapSection,
  }

  return (
    <div className="min-h-screen bg-[var(--page-bg)]" style={pageStyle}>
      <main className="max-w-lg mx-auto px-4 py-10">
        {/* Logo + Name */}
        <div className="text-center mb-8">
          <div className="flex justify-center">
            {tenant.logo_url ? (
              <img src={tenant.logo_url} alt={tenant.name} className="w-20 h-20 rounded-full object-cover border-2 border-[var(--page-primary)]/20" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--page-primary)] to-[var(--page-secondary)] flex items-center justify-center">
                <span className="text-2xl font-bold text-[var(--page-btn-text)]">{tenant.name.charAt(0)}</span>
              </div>
            )}
          </div>
          <h1 className="text-xl font-[var(--page-heading-font)] italic font-bold text-[var(--page-primary)] mt-4">{tenant.name}</h1>
          {tenant.address && <p className="text-sm text-muted-foreground mt-1">{tenant.address}</p>}
        </div>

        {/* Owner greeting */}
        <div className="text-center mb-8 animate-fade-in">
          <p className="text-sm text-[var(--page-primary)]/80 font-[var(--page-body-font)]">
            ¡Hola! Soy <span className="font-semibold">{tenant.name}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Agenda tu hora directamente desde aquí
          </p>
        </div>

        {sortedSections.map(section => {
          if (!section.visible) return null
          return <div key={section.id}>{sectionRenderers[section.id]}</div>
        })}

        {/* Footer */}
        <footer className="pt-8 pb-4 text-center text-xs text-muted-foreground border-t border-border-subtil mt-8">
          {tenant.name}{cleanPhone ? ` · ${cleanPhone}` : ""}
          <p className="mt-2 text-[10px] opacity-50">Creado con <a href="/" className="hover:opacity-100 transition-opacity font-semibold">CLICIO</a></p>
        </footer>
      </main>

      {/* Lightbox */}
      {lightboxUrl && (
        <LightboxModal url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      )}

      {/* WhatsApp FAB */}
      {cleanPhone && (
        <a
          href={`https://wa.me/${cleanPhone}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 bg-green-500 text-white rounded-full p-3.5 md:p-4 shadow-lg hover:bg-green-600 transition-colors"
        >
          <WhatsAppIcon className="h-5 w-5 md:h-6 md:w-6 text-white" />
        </a>
      )}
    </div>
  )
}

function InstagramIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" className="stroke-[#E4405F]" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" className="stroke-[#E4405F]" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" className="stroke-[#E4405F]" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function WrenchIcon() {
  return (
    <svg className="h-5 w-5 text-[var(--page-primary)] shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75a4.5 4.5 0 0 1-4.884 4.484c-1.076-.091-2.264.071-2.95.904l-7.152 8.684a2.548 2.548 0 1 1-3.586-3.586l8.684-7.152c.833-.686.995-1.874.904-2.95a4.5 4.5 0 0 1 6.336-4.486l-3.276 3.276a3.004 3.004 0 0 0 2.25 2.25l3.276-3.276c.256.565.398 1.192.398 1.852Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.867 19.125h.008v.008h-.008v-.008Z" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  )
}

function LightboxModal({ url, onClose }: { url: string; onClose: () => void }) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <button
        onClick={(e) => { e.stopPropagation(); onClose() }}
        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors p-2"
        aria-label="Cerrar"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
      <img src={url} alt="Trabajo realizado" className="max-w-full max-h-full object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
    </div>
  )
}
