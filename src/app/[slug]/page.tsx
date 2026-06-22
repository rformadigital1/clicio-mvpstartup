"use client"

import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Tenant, Service, BusinessHour, GalleryImage } from "@/lib/types"
import { BookingWizard } from "@/components/booking/booking-wizard"

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
      <div className="min-h-screen bg-bg-concreto flex items-center justify-center">
        <div className="text-center animate-pulse">
          <p className="text-azul-rey font-[family-name:var(--font-display)] italic text-xl">Cargando...</p>
        </div>
      </div>
    )
  }

  if (notFound || !tenant) {
    return (
      <div className="min-h-screen bg-bg-concreto flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-5xl mb-4">🔧</p>
          <h1 className="text-2xl font-bold text-foreground mb-2">Taller no encontrado</h1>
          <p className="text-muted-foreground">El taller que buscas no existe o la URL es incorrecta.</p>
        </div>
      </div>
    )
  }

  const cleanPhone = tenant.phone?.replace(/[^0-9]/g, "")

  return (
    <div className="min-h-screen bg-bg-concreto">
      <main className="max-w-lg mx-auto px-4 py-10">
        {/* Logo + Name */}
        <div className="text-center mb-8">
          <div className="flex justify-center">
            {tenant.logo_url ? (
              <img src={tenant.logo_url} alt={tenant.name} className="w-20 h-20 rounded-full object-cover border-2 border-azul-rey/20" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-azul-rey to-celeste-cielo flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{tenant.name.charAt(0)}</span>
              </div>
            )}
          </div>
          <h1 className="text-xl font-[family-name:var(--font-display)] italic font-bold text-azul-rey mt-4">{tenant.name}</h1>
          {tenant.address && <p className="text-sm text-muted-foreground mt-1">{tenant.address}</p>}
        </div>

        {/* Quick Action Buttons */}
        <div className="space-y-3 mb-10">
          {cleanPhone && (
            <a
              href={`https://wa.me/${cleanPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 w-full bg-white border border-border-subtil rounded-lg px-4 py-3 text-sm font-medium hover:border-azul-rey/40 hover:shadow-sm transition-all"
            >
              <WhatsAppIcon />
              WhatsApp
              <span className="ml-auto text-muted-foreground text-xs">↗</span>
            </a>
          )}
          {tenant.instagram && (
            <a
              href={tenant.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 w-full bg-white border border-border-subtil rounded-lg px-4 py-3 text-sm font-medium hover:border-azul-rey/40 hover:shadow-sm transition-all"
            >
              <InstagramIcon />
              Instagram
              <span className="ml-auto text-muted-foreground text-xs">↗</span>
            </a>
          )}
          <button
            onClick={() => servicesRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="flex items-center gap-3 w-full bg-white border border-border-subtil rounded-lg px-4 py-3 text-sm font-medium hover:border-azul-rey/40 hover:shadow-sm transition-all text-left"
          >
            <WrenchIcon />
            Servicios
          </button>
          <button
            onClick={() => wizardRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="flex items-center gap-3 w-full bg-azul-rey text-white border border-azul-rey rounded-lg px-4 py-3 text-sm font-semibold hover:bg-azul-rey/90 transition-all shadow-sm"
          >
            <CalendarIcon />
            Agendar Ahora
          </button>
        </div>

        {/* Services */}
        {services.length > 0 && (
          <section ref={servicesRef} id="servicios" className="py-8">
            <h3 className="text-lg font-[family-name:var(--font-display)] italic font-bold text-azul-rey mb-5 text-center">Servicios</h3>
            <div className="space-y-3">
              {services.map((s) => (
                <div key={s.id} className="bg-white rounded-lg p-4 border border-border-subtil flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-sm">{s.name}</h4>
                    {s.duration && <p className="text-xs text-muted-foreground">{s.duration} min</p>}
                  </div>
                  {s.price && <p className="text-sm font-bold text-azul-rey">$ {s.price.toLocaleString("es-CL")}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Booking Wizard */}
        <div ref={wizardRef} className="py-8">
          <BookingWizard tenant={tenant} services={services} businessHours={hours} />
        </div>

        {/* Gallery */}
        {gallery.length > 0 && (
          <section className="py-8">
            <h3 className="text-lg font-[family-name:var(--font-display)] italic font-bold text-azul-rey mb-5 text-center">Trabajos Realizados</h3>
            <div className="grid grid-cols-2 gap-3">
              {gallery.map((img) => (
                <button key={img.id} onClick={() => setLightboxUrl(img.image_url)} className="aspect-square overflow-hidden rounded-lg border border-border-subtil group">
                  <img src={img.image_url} alt={`Trabajo realizado por ${tenant.name}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Lightbox */}
        {lightboxUrl && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer" onClick={() => setLightboxUrl(null)}>
            <img src={lightboxUrl} alt="Trabajo realizado" className="max-w-full max-h-full object-contain rounded-lg" />
          </div>
        )}

        {/* Map */}
        {tenant.address && (
          <section className="py-8">
            <h3 className="text-lg font-[family-name:var(--font-display)] italic font-bold text-azul-rey mb-5 text-center">Ubicación</h3>
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
        )}

        {/* Footer */}
        <footer className="pt-8 pb-4 text-center text-xs text-muted-foreground border-t border-border-subtil mt-8">
          {tenant.name}{cleanPhone ? ` · ${cleanPhone}` : ""}
        </footer>
      </main>

      {/* WhatsApp FAB */}
      {cleanPhone && (
        <a
          href={`https://wa.me/${cleanPhone}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 bg-green-500 text-white rounded-full p-3.5 md:p-4 shadow-lg hover:bg-green-600 transition-colors"
        >
          <svg className="h-5 w-5 md:h-6 md:w-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>
      )}
    </div>
  )
}

function WhatsAppIcon() {
  return (
    <svg className="h-5 w-5 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
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
    <svg className="h-5 w-5 text-azul-rey shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
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
