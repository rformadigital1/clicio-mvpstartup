# Admin Page Builder — Personalización Visual de Página Pública

## Objetivo

Agregar una sección en el dashboard admin (`/dashboard/appearance`) que
permita al dueño del taller personalizar colores, tipografía, orden/secciones
visibles y botones de la página pública `/[slug]`, sin vista previa en tiempo
real — los cambios se ven al recargar la página pública.

## Arquitectura

```
Dashboard (settings/layout)
  └─ /dashboard/appearance (nueva página admin)
       ├─ ColorSection         — 8 inputs color picker
       ├─ TypographySection    — dropdown fuente heading/body
       ├─ SectionsSection      — toggle on/off + drag & drop reorder
       └─ ButtonsSection       — toggle + label editable por botón

Página pública
  └─ TenantPageConfig (hook/helper)
       └─ lee tenant.page_config → aplica al render
```

## Datos — Columna `page_config` (JSONB) en `tenants`

### Schema TypeScript

```ts
interface PageConfig {
  colors: PageColors
  typography: PageTypography
  sections: PageSection[]
  buttons: PageButtons
}

interface PageColors {
  primary: string        // #1A3A8A
  secondary: string      // #4A90D9
  accent: string         // #E3242B
  background: string     // #F7F5F3
  cardBg: string         // #FFFFFF
  text: string           // #1A1A1A
  buttonBg: string       // #1A3A8A
  buttonText: string     // #FFFFFF
}

interface PageTypography {
  headingFont: string    // CSS font-family value
  bodyFont: string       // CSS font-family value
}

interface PageSection {
  id: SectionId
  visible: boolean
  order: number
}

type SectionId =
  | "quick-buttons"
  | "services"
  | "booking-wizard"
  | "gallery"
  | "map"

interface PageButtons {
  whatsapp:  { visible: boolean; label: string }
  instagram: { visible: boolean; label: string }
  servicios: { visible: boolean; label: string }
  agendar:   { visible: boolean; label: string }
}
```

### Default

```sql
page_config jsonb not null default '{
  "colors": {
    "primary": "#1A3A8A",
    "secondary": "#4A90D9",
    "accent": "#E3242B",
    "background": "#F7F5F3",
    "cardBg": "#FFFFFF",
    "text": "#1A1A1A",
    "buttonBg": "#1A3A8A",
    "buttonText": "#FFFFFF"
  },
  "typography": {
    "headingFont": "var(--font-display)",
    "bodyFont": "Inter"
  },
  "sections": [
    { "id": "quick-buttons", "visible": true, "order": 0 },
    { "id": "services", "visible": true, "order": 1 },
    { "id": "booking-wizard", "visible": true, "order": 2 },
    { "id": "gallery", "visible": true, "order": 3 },
    { "id": "map", "visible": true, "order": 4 }
  ],
  "buttons": {
    "whatsapp":  { "visible": true, "label": "WhatsApp" },
    "instagram": { "visible": true, "label": "Instagram" },
    "servicios": { "visible": true, "label": "Servicios" },
    "agendar":   { "visible": true, "label": "Agendar Ahora" }
  }
}'::jsonb
```

### Migración

```sql
ALTER TABLE tenants
  ADD COLUMN page_config jsonb
  NOT NULL DEFAULT '<DEFAULT_JSON>';
```

## Admin — `/dashboard/appearance`

Layout: max-w-lg, mismo container que settings.

### 1. ColorSection

8 filas, cada una con label + input `type="color"` + hex value display.

| Label       | Campo config        |
|-------------|---------------------|
| Primario    | colors.primary      |
| Secundario  | colors.secondary    |
| Acento      | colors.accent       |
| Fondo       | colors.background   |
| Tarjetas    | colors.cardBg       |
| Texto       | colors.text         |
| Botón fondo | colors.buttonBg     |
| Botón texto | colors.buttonText   |

Botón "Restaurar defaults" al final.

### 2. TypographySection

- **Fuente headings**: dropdown con opciones predefinidas
  - `var(--font-display)` (cursiva BMW)
  - `Inter`
  - `Arial`
  - `Georgia`
- **Fuente cuerpo**: mismo dropdown

### 3. SectionsSection

Lista reordenable con drag & drop (usar `@dnd-kit/core` o sortable simple):

- Cada ítem muestra: icono de arrastre (6 dots grip), toggle on/off, nombre de sección
- Orden determinado por drag & drop
- `booking-wizard` no puede ocultarse, toggle deshabilitado, tooltip "Sección principal"

### 4. ButtonsSection

Lista de botones rápidos, cada uno con:
- Toggle on/off
- Input editable para label

### Guardado

Botón "Guardar cambios" al final del formulario. `UPDATE tenants SET page_config = $1`.

## Página Pública — Aplicar Config

### Hook `usePageConfig(tenant)`

- Parsea `tenant.page_config` con fallback al default
- Retorna `PageConfig` tipado

### CSS Variables inyectadas

En el `<div>` raíz de `/[slug]`, aplicar inline styles:
```tsx
<div style={{
  "--page-primary": colors.primary,
  "--page-secondary": colors.secondary,
  "--page-accent": colors.accent,
  "--page-bg": colors.background,
  "--page-card-bg": colors.cardBg,
  "--page-text": colors.text,
  "--page-btn-bg": colors.buttonBg,
  "--page-btn-text": colors.buttonText,
  "--page-heading-font": typography.headingFont,
  "--page-body-font": typography.bodyFont,
} as React.CSSProperties}>
```

### Reemplazo de Tailwind classes

Las clases duras (`bg-bg-concreto`, `text-azul-rey`, etc.) se reemplazan por
variables CSS. Ejemplo:

| Antes                           | Después                           |
|---------------------------------|-----------------------------------|
| `bg-bg-concreto`                | `bg-[var(--page-bg)]`             |
| `text-azul-rey`                 | `text-[var(--page-primary)]`      |
| `bg-azul-rey`                   | `bg-[var(--page-btn-bg)]`         |
| `text-white` (en botones)       | `text-[var(--page-btn-text)]`     |
| `bg-white` (cards)              | `bg-[var(--page-card-bg)]`        |
| `font-[family-name:var(--font-display)]` | `font-[var(--page-heading-font)]` |
| `text-muted-foreground`         | se mantiene (es semantic)         |

### Render condicional + orden

```tsx
const config = usePageConfig(tenant)
const sortedSections = [...config.sections]
  .sort((a, b) => a.order - b.order)

{sortedSections.map(section => {
  if (!section.visible) return null
  switch (section.id) {
    case "quick-buttons": return <QuickButtonsSection ... />
    case "services":      return <ServicesSection ... />
    case "booking-wizard": return <BookingWizardSection ... />
    case "gallery":       return <GallerySection ... />
    case "map":           return <MapSection ... />
  }
})}
```

## Consideraciones

- Sin preview en tiempo real — el admin guarda y abre pestaña pública
- `booking-wizard` siempre visible, toggle disabled en admin
- Si se borra la columna o JSON inválido → fallback al default
- Las secciones tienen `order` para reordenamiento; drag & drop recalcula en frontend
- Usar `@dnd-kit/core` + `@dnd-kit/sortable` para drag & drop (ya liviano, sin dependencias pesadas)

## Archivos a Modificar/Crear

| Archivo | Acción |
|---------|--------|
| `src/lib/types.ts` | Agregar `PageConfig` y subtipos |
| `src/app/dashboard/appearance/page.tsx` | Crear - página admin completa |
| `src/app/[slug]/page.tsx` | Modificar - leer config, secciones dinámicas, CSS variables |
| `supabase/migrations/20260622003_add_page_config.sql` | Crear |
| `supabase-schema.sql` | Modificar - columna + default |

## No Incluído (scope futuro)

- Live preview en admin
- Templates pre-diseñados
- Subida de imágenes de fondo/hero
- Personalización de tipografía via Google Fonts API
- Múltiples variantes de página (A/B testing)
- Historial de versiones de config
