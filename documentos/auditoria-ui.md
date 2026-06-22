# Auditoría UI — Clicio.app

Fecha: 2026-06-21
Contexto: Auditoría visual y de consistencia usando skills brainstorming + interface-design.

---

## Resumen

La app es funcional pero visualmente genérica. Usa componentes shadcn/ui default sin personalización de marca. Las páginas fueron construidas independientemente sin un sistema de diseño compartido, resultando en duplicación de constantes visuales y patrones inconsistentes.

---

## 🔴 Alta Prioridad

### 1. Sidebar sin indicador de ruta activa

**Archivo:** `src/app/dashboard/layout.tsx:149-158`
**Problema:** Los nav links no muestran qué página está activa. El usuario no tiene contexto de ubicación sin mirar el título de la página.
**Solución:** Comparar `pathname` con `item.href` y aplicar clase activa (`bg-accent text-accent-foreground`). Considerar sub-rutas como `/dashboard/calendar` activas cuando `pathname.startsWith(item.href)` para evitar falsos negativos en secciones agrupadas.

### 2. Sin sistema de diseño documentado

**Archivo:** No existe `.interface-design/system.md`
**Problema:** No hay registro centralizado de decisiones de diseño: paleta, tipografía, spacing, depth strategy, patrones de componentes. Cada página usa valores inline. Cambiar un color requiere editar N archivos.
**Solución:** Crear `.interface-design/system.md` documentando tokens, patrones y decisiones de diseño. Servirá como single source of truth para todo el UI.

### 3. Colores de estado duplicados en 3 archivos

**Archivos:**
- `src/app/dashboard/calendar/page.tsx:18-38` — `STATUS_COLORS`, `STATUS_TEXT_COLORS`, `STATUS_LABELS` + badge classes inline
- `src/app/dashboard/page.tsx:13-27` — `statusLabels`, `statusColors`
- `src/app/dashboard/reports/page.tsx` — no redefine pero usa conteos por status

**Problema:** Definir los mismos colores/labels en múltiples archivos garantiza desincronización futura. Cambiar un color de estado = cambiar en 3+ lugares.
**Solución:** Extraer a `src/lib/booking-constants.ts` con todos los formatos (hex para inline styles, tailwind classes para badges). Importar desde ahí en todas las páginas.

---

## 🟡 Media Prioridad

### 4. Dashboard home sin contexto visual en métricas

**Archivo:** `src/app/dashboard/page.tsx:164-216`
**Problema:** Las tarjetas de métricas muestran solo un número grande + label. Sin sparkline, sin tendencia vs período anterior, sin progreso diario. La tarjeta "Hoy" muestra el total de reservas pero no el desglose por hora restante ni comparación con días anteriores.
**Solución:** Agregar mini sparklines (SVG inline) en ingresos/reservas. Mostrar delta vs mes anterior en las métricas principales. Desglose horario en tarjeta "Hoy".

### 5. Inconsistencia de layout entre páginas

**Archivos:** Customers, Services, Calendar, Reports
**Problema:** Cada página reinventa su layout:
- Customers/Services: grid de cards con header variable
- Calendar: grid complejo + tabla debajo
- Reports: cards + barras + donut
No hay un patrón de página estándar (page header + toolbar + content area).
**Solución:** Definir layout de página estándar en system.md. Componente `PageHeader` reutilizable con título, descripción opcional y acciones.

### 6. Reports: donut chart con conic-gradient inline

**Archivo:** `src/app/dashboard/reports/page.tsx:365-368`
**Problema:** `conic-gradient()` inline CSS es frágil y difícil de mantener. No hay separación entre lógica de gráfico y presentación.
**Solución:** Extraer a componente `DonutChart` reutilizable con props `value`/`max`/`colors`.

### 7. Modales sin tamaño estándar

**Archivo:** Múltiples `Dialog` en todas las páginas
**Problema:** `DialogContent` usa el `max-w` default de shadcn. No hay variantes de tamaño según contenido (form vs tabla vs confirmación).
**Solución:** Definir variantes `sm`/`md`/`lg`/`xl`/`full` en el sistema de diseño.

### 8. Sin `active` state visual en tabs de Configuración

**Archivo:** `src/app/dashboard/settings/page.tsx`
**Problema:** La página de settings usa tabs vía query param `?tab=` pero no hay indicación visual de qué tab está activo.
**Solución:** Aplicar estilo activo en el tab seleccionado.

---

## 🟢 Baja Prioridad

### 9. Skeleton loading sin shimmer

**Problema:** Los skeletons son estáticos sin animación `animate-pulse`. Feedback visual pobre durante carga.
**Solución:** Usar `animate-pulse` de Tailwind en todos los Skeleton.

### 10. Transiciones mínimas entre páginas

**Problema:** `animate-fade-in` es la única transición. No hay micro-interacciones en hover de cards listas, ni transiciones de layout.
**Solución:** Agregar `transition-all` en elementos interactivos, `stagger` en animaciones de listas.

### 11. Auth gradient animation rápida

**Archivo:** `src/app/globals.css` — `gradient-shift` keyframes
**Problema:** La animación de 10s se siente apresurada. Para un look más premium debería ser más lenta y con easing suave.
**Solución:** Cambiar a 15s con `ease-in-out`.

### 12. Logo en sidebar sin fallback visual

**Archivo:** `src/app/dashboard/layout.tsx:112`
**Problema:** Cuando hay logo, se muestra imagen. Cuando no, solo texto "CLICIO". No hay transición entre estados.
**Solución:** Agregar contenedor con tamaño fijo para evitar layout shift.

---

## Siguientes pasos

Implementar prioridad alta primero:
1. Crear `.interface-design/system.md`
2. Centralizar constantes de estado en `src/lib/booking-constants.ts`
3. Sidebar con ruta activa
