# Auditoría de Diseño — CLICIO

**Fecha:** 2026-06-24
**Superficies analizadas:** Landing page, Página pública (slug), Dashboard
**Estilo target:** Linktree + Calendly — moderno, pulido, sin aspecto de template AI

---

## Resumen por severidad

| Severidad | Cantidad |
|-----------|----------|
| 🔴 Alta | 6 |
| 🟡 Media | 14 |
| 🟢 Baja | 11 |
| **Total** | **31** |

---

## 🔴 Alta

### A1. Landing: Sin hero image ni mockup del producto
**Dónde:** `src/app/page.tsx`
**Problema:** Hero 100% tipográfico. No muestra el producto en contexto. Sin screenshot del dashboard, sin mockup en tablet/teléfono, sin demo visual. El usuario no puede imaginar el producto.
**Fix:** Hero dividido en 2 columnas: texto izq + mockup del dashboard corriendo en una laptop/tablet der. Usar `next/image` con screenshot real del dashboard Calendar o Dashboard page. Añadir badge flotante "En vivo" o stats overlay.
**Referencia:** Linear.app, Calendly landing — siempre muestran el producto funcionando.

### A2. Landing: Sin logo visual, solo texto "CLICIO"
**Dónde:** `src/app/page.tsx:9`, `src/app/dashboard/layout.tsx:116`, favicon
**Problema:** Marca representada solo como texto. Sin isotipo, sin wordmark con personalidad. Favicon es emoji 🔧.
**Fix:** Diseñar wordmark CLICIO con tipografía personalizada o logotipo con icono de llave/engranaje. Favicon SVG con el mismo símbolo. Aplicar en landing, dashboard, slug.
**Referencia:** Linear usa solo texto pero con tracking y weight únicos; Calendly tiene " calendly" en wordmark.

### A3. Slug: Sin foto del dueño ni saludo personal
**Dónde:** `src/app/[slug]/page.tsx:247-258`
**Problema:** Linktree sin foto no es Linktree. Solo muestra logo del taller + nombre. Falta la conexión personal que hace exitoso el formato link-in-bio.
**Fix:** Añadir sección "owner" con foto del dueño (desde tenant o subida aparte), saludo tipo "Hola, soy [nombre]" y una bio corta. Posición: antes de quick-buttons.
**Referencia:** Linktree — la foto y el saludo son lo primero que ves.

### A4. Dashboard: Sin dark mode funcional
**Dónde:** `src/app/globals.css:47-67`
**Problema:** Variables `.dark` definidas pero no hay toggle ni detección `prefers-color-scheme`. El dark mode no es accesible.
**Fix:** Añadir ThemeProvider con toggle en header. Soportar `prefers-color-scheme` como default. Migrar a strategy `class` con Tailwind v4 `@custom-variant dark`.
**Referencia:** shadcn/ui dashboard template incluye dark mode toggle funcional.

### A5. Dashboard: Loading state inicial genérico
**Dónde:** `src/app/dashboard/layout.tsx:101-104`
**Problema:** Mientras carga auth + profile, muestra solo texto "Cargando..." sin skeleton. Pantalla blanca sin contexto.
**Fix:** Skeleton de sidebar + header mientras carga auth. Después skeleton de contenido específico por página.
**Referencia:** Vercel dashboard — skeleton inmediato que respeta layout structure.

### A6. Dashboard: Button component con shadow (contradice borders-only)
**Dónde:** `src/components/ui/button.tsx:11-12`
**Problema:** La estrategia de profundidad definida es borders-only, pero `Button` variant `default` usa `shadow` y `outline` usa `shadow-sm`. Inconsistente.
**Fix:** Eliminar `shadow` de `default`, `shadow-sm` de `outline`/`destructive`/`secondary`. Consistente con brand redesign spec.
**Referencia:** Brand redesign spec sección 4: "No shadows. Borders-only."

---

## 🟡 Media

### M1. Landing: Animaciones CSS definidas pero no aplicadas
**Dónde:** `src/app/globals.css:7-15, src/app/page.tsx`
**Problema:** `fade-in-up` y `fade-in` existen en CSS pero nunca se usan en landing. Sin animate-on-scroll ni entrance animations.
**Fix:** Añadir clases `animate-fade-in-up` a secciones al hacer scroll. Usar IntersectionObserver simple o librería liviana.

### M2. Landing: Sin testimonios ni social proof
**Dónde:** `src/app/page.tsx`
**Problema:** Sin fotos de clientes, sin logotipos de talleres existentes, sin estadísticas ("+50 talleres", "5000 reservas gestionadas"). Baja credibilidad.
**Fix:** Sección de testimonios con foto + nombre + reseña real. Sección de stats con contadores animados. Galería de logos de talleres (si existen).

### M3. Landing: Cards de solución sin iconografía
**Dónde:** `src/app/page.tsx:60-69`
**Problema:** 3 columnas (Web, Agenda, Fidelización) sin iconos. Solo texto en cards planas.
**Fix:** Añadir icono SVG arriba de cada card (Globe para Web, Calendar para Agenda, Award para Fidelización). Color primary.

### M4. Landing: Pricing sin highlight en plan recomendado
**Dónde:** `src/app/page.tsx:85-101`
**Problema:** Precio único sin tarjetas visuales, sin badge "Recomendado", sin contraste con fondo. Footer CTA genérico.
**Fix:** Highlight pricing con border azul-rey + badge "Plan Único" + background suave. Añadir garantía o trial.

### M5. Slug: Booking wizard sin micro-animaciones entre pasos
**Dónde:** `src/components/booking/booking-wizard.tsx`
**Problema:** Cambio de paso instantáneo. Sin transición de entrada/salida del contenido. Se siente abrupto.
**Fix:** Animar contenedor de step con fade + slide horizontal. 200ms ease-out. Wizard progress con barra animada entre pasos.

### M6. Slug: Calendar grid genérico sin personalidad
**Dónde:** `src/components/booking/booking-wizard.tsx` (step 1 calendar)
**Problema:** Grid de calendario funcional pero sin estilo distintivo. Días disponibles/ocupados sin diferenciación visual atractiva.
**Fix:** Días con slots disponibles: fondo suave con color primary + texto bold. Día seleccionado: ring. Día sin slots: muted. Hover con lift sutil.

### M7. Dashboard: Sidebar sin hover color en icons
**Dónde:** `src/app/dashboard/layout.tsx:170-178`
**Problema:** Hover en sidebar items solo cambia bg, no cambia color del icono. El icono se queda en gris.
**Fix:** Añadir `[&>svg]:group-hover:text-azul-rey` en hover states o transition del icon color junto con text.
**Referencia:** Linear sidebar — icon y texto cambian juntos.

### M8. Dashboard: Métricas sin sparklines ni mini gráficos
**Dónde:** `src/app/dashboard/page.tsx:198-221`
**Problema:** Cards de métricas planas: número + label. Sin sparkline de tendencia, sin mini barra de progreso.
**Fix:** Añadir sparkline SVG inline en cards de "Reservas hoy" e "Ingresos". Datos de días anteriores para mini trend.

### M9. Dashboard: Timeline cards sin diferenciación visual fuerte
**Dónde:** `src/app/dashboard/page.tsx:300-330`
**Problema:** Timeline cards tienen border-left por status pero son genéricas. Sin avatar del cliente, sin icono de vehículo.
**Fix:** Añadir avatar circular con inicial del cliente a la izquierda. Compactar info en 2 líneas máx. Badge de status más visible.

### M10. Dashboard: Modales de formulario (crear/editar booking) sin tabs
**Dónde:** `src/app/dashboard/calendar/page.tsx:495-665`
**Problema:** Crear/editar reserva en modales largos con scroll. Muchos campos en una sola vista.
**Fix:** Simplificar — selector de cliente con autocomplete, selector de vehículo anidado. O wizard compacto de 2 pasos dentro del modal.

### M11. Dashboard: Settings sin layout wrapper consistente
**Dónde:** `src/app/dashboard/settings/taller/page.tsx`, `horarios/`, `galeria/`, etc.
**Problema:** Cada sub-página de settings tiene su propio título, max-width, estructura. Sin navegación interna entre tabs de settings.
**Fix:** Layout wrapper de settings con tabs/sub-nav horizontal + PageHeader consistente. Breadcrumbs opcionales.

### M12. Dashboard: Appearance duplicado (2 rutas)
**Dónde:** `src/app/dashboard/appearance/page.tsx` y `src/app/dashboard/settings/apariencia/page.tsx`
**Problema:** Misma funcionalidad en 2 URLs diferentes. Confusión y duplicación de código.
**Fix:** Eliminar `/dashboard/appearance/`. Mantener solo `/dashboard/settings/apariencia`. Redirigir ruta antigua.

### M13. System: Variables shadcn mezcladas con tokens custom
**Dónde:** `src/app/globals.css:24-103`
**Problema:** `--background`, `--primary` (shadcn) coexisten con `--color-azul-rey`, `--color-bg-concreto` (custom). Algunas duplican valores.
**Fix:** Unificar: que shadcn use los valores de los tokens custom (ej: `--primary: var(--color-azul-rey)`). O migrar todo a tokens semanticos.

### M14. System: Sin layout de página consistente
**Dónde:** Múltiples páginas
**Problema:** Algunas usan `PageHeader`, otras definen su propio `h1`. Sin `max-w` estándar. Sin padding consistente entre páginas.
**Fix:** Estandarizar: `max-w-4xl` o `max-w-5xl` en todas las páginas del dashboard. `PageHeader` obligatorio en cada página. Layout wrapper opcional.

---

## 🟢 Baja

### B1. Landing: Header sin cambio visual en scroll
**Dónde:** `src/app/page.tsx:7`
**Problema:** `backdrop-blur` aplicado siempre. Sin cambio de background/border al hacer scroll (no hay scroll listener).
**Fix:** Añadir clase condicional `shadow-xs` o border más visible al scrollear. Mínimo, pero refuerza sensación sólida.

### B2. Landing: Pricing con checkmark texto
**Dónde:** `src/app/page.tsx:92-93`
**Problema:** Usa `✓` Unicode en lugar de icono SVG de check.
**Fix:** Reemplazar con `CheckCircle` de lucide-react o icono SVG consistente.

### B3. Landing: Sin proyectos relacionados / CTA contextual
**Dónde:** `src/app/page.tsx`
**Problema:** Después de precio, salta directo a "Comienza hoy". Sin enlace a ejemplos, demo, o FAQ.
**Fix:** Añadir sección "Ejemplos de talleres con CLICIO" (galería de slugs) o FAQ antes del CTA final.

### B4. Slug: Código SVG de WhatsApp duplicado 3 veces
**Dónde:** `src/app/[slug]/page.tsx:296-301`, `wizard`, FAB
**Problema:** Mismo icono WhatsApp inline SVG duplicado en 3 lugares. Mala mantenibilidad.
**Fix:** Extraer a componente `IconWhatsApp` compartido en `@/components/icons/`.

### B5. Slug: Lightbox sin botón cerrar visible
**Dónde:** `src/app/[slug]/page.tsx:273-277`
**Problema:** Lightbox se cierra haciendo click en cualquier lado. Sin botón X visible, sin tecla Escape (falta listener).
**Fix:** Añadir botón X en esquina superior derecha + listener Escape key. Animar entrada con fade.

### B6. Slug: Footer mínimo sin marca
**Dónde:** `src/app/[slug]/page.tsx:267-269`
**Problema:** Footer solo tiene nombre y teléfono. Sin "Powered by CLICIO", sin enlace a landing.
**Fix:** Añadir "Creado con CLICIO" con link a landing, sutil en footer.

### B7. Dashboard: Sin breadcrumbs en settings
**Dónde:** `src/app/dashboard/settings/taller/page.tsx` y sub-páginas
**Problema:** Al entrar a "Información del Taller" no hay indicación de que estás en Configuración > Taller.
**Fix:** Breadcrumbs tipo "Dashboard > Configuración > Taller" con links. O al menos subrayar active en sidebar.

### B8. Dashboard: Tabla agenda sin row hover mejorado
**Dónde:** `src/app/dashboard/calendar/page.tsx:717`
**Problema:** `hover:bg-white/50` es casi imperceptible sobre fondo blanco.
**Fix:** `hover:bg-bg-superficie` o `hover:bg-muted` para contraste visible.

### B9. Dashboard: Animación fade-in definida pero sin stagger
**Dónde:** `src/app/globals.css:12-14`, dashboard pages
**Problema:** `animate-fade-in` aplicado a contenedores completos. Todo aparece a la vez.
**Fix:** Stagger children con `animation-delay` usando style prop o clase utilitaria (ej: `[&>*:nth-child(1)]:animate-fade-in-up [&>*:nth-child(2)]:animation-delay-100`).

### B10. System: Geist font cargada pero no usada
**Dónde:** `src/app/layout.tsx:5-6`
**Problema:** Geist y Geist Mono de next/font/google se cargan pero no se aplican en CSS (Inter es la default). Peso innecesario.
**Fix:** Eliminar Geist si no se usa. O usar Geist como font-sans en lugar de Inter.

### B11. System: Sin manejo de `prefers-reduced-motion`
**Dónde:** `src/app/globals.css`
**Problema:** Animaciones definidas pero sin media query `@media (prefers-reduced-motion: reduce)`. Usuarios con sensibilidad vestibular no pueden desactivarlas.
**Fix:** Añadir `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; } }`

---

## Priorización recomendada

| Orden | Findings | Impacto visual | Esfuerzo estimado |
|-------|----------|----------------|-------------------|
| 1 | A3 (foto dueño slug) | Alto | Bajo |
| 2 | A1 (hero landing con mockup) | Muy alto | Medio |
| 3 | A2 (logo + favicon) | Alto | Bajo |
| 4 | A5 (loading skeletons) | Medio | Bajo |
| 5 | A6 (remover shadow buttons) | Bajo | Muy bajo |
| 6 | M1 (animaciones landing) | Alto | Bajo |
| 7 | M5 (micro-animaciones wizard) | Medio | Medio |
| 8 | M2 (testimonios landing) | Alto | Medio |
| 9 | M7 (sidebar icon hover) | Bajo | Muy bajo |
| 10 | M11 (settings layout unificado) | Medio | Medio |
| 11 | A4 (dark mode) | Medio | Alto |
| 12 | M13 (unificar variables CSS) | Bajo | Bajo |

---

## Assets necesarios

- Screenshot del dashboard en contexto real (laptop/tablet) — para landing hero
- Wordmark/isotipo CLICIO — para logo y favicon
- Fotos de dueños de taller reales (placeholder) — para slug
- Testimonios con foto — para landing
- Iconos SVG personalizados para landing cards

---

## Notas sobre Linktree + Calendly

| Elemento | Linktree | Calendly | Clicio hoy | Target |
|----------|----------|----------|------------|--------|
| Foto/avatar | Dueño | Dueño | Logo taller | Dueño + Logo |
| Saludo personal | Texto bio | Nombre | No | "Hola, soy [dueño]" |
| Links rápidos | Redes sociales | --- | WhatsApp, IG | Same + Mapa + Web |
| Booking integrado | No | Sí (paso a paso) | Sí (wizard 4 pasos) | Wizard pulido con micro-animaciones |
| Branding sutil | "Linktree" footer | "Calendly" badge | No | "Creado con CLICIO" |
| Templates visuales | Limitados | Varios | 4 templates | Ejecutar templates con consistencia visual |
