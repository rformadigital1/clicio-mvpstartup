# Landing CLICIO — Device Mockups + Sistema Real

## Problema
Landing se ve genérica. Usa mockups inventados que no muestran el producto real. El dueño de taller no se siente identificado.

## Solución
Reemplazar mockups genéricos por device mockups (phone, laptop) que contengan componentes reales del sistema. Cuando existan capturas PNG, se reemplazan sin cambiar estructura.

## Cambios por sección

### Hero
- **Mockup actual:** DashboardPreview (laptop, inventado)
- **Mockup nuevo:** Phone frame con perfil público del taller (vista cliente: logo, servicios, botón agendar, confirmación WhatsApp)
- **Por qué:** El dueño de taller necesita ver lo que sus clientes van a ver. El phone es el dispositivo del cliente.

### Features — "Tu taller en Google"
- **Mockup actual:** TenantPagePreview (genérico)
- **Mockup nuevo:** Phone frame mostrando la página pública del taller exactamente como la ve el cliente (navbar con servicios, galería, botón WhatsApp)
- **Por qué:** Muestra el producto real funcionando.

### Features — "Reservas sin llamadas"
- **Mockup actual:** BookingPreview (wizard partido en dos)
- **Mockup nuevo:** Phone frame con el wizard de booking completo (calendario + selección de servicios + confirmación)
- **Por qué:** El cliente reserva desde el celular. Mostrarlo en phone es natural.

### Testimonials
- **Mockup actual:** Solo texto + avatar con inicial
- **Mockup nuevo:** Cada testimonio incluye una captura de WhatsApp real mostrando la interacción taller-cliente
- **Por qué:** Prueba social + prueba del sistema en uno.

### Pricing / CTA
- Sin cambios visuales. Solo mantener consistencia.

## Device frames a usar
- **Phone:** `border: 4px solid #1e293b; border-radius: 24px;` con notch simulado arriba
- **WhatsApp:** Fondo verde `#e8f5e9` con header `#075e54`, burbujas de chat

## Implementación
1. Crear componente `PhoneFrame.tsx` (wrapper reutilizable)
2. Crear componente `ChatPreview.tsx` (WhatsApp simulator)
3. Actualizar Hero: reemplazar DashboardPreview con PhoneFrame > TenantPagePreview
4. Actualizar Features: reemplazar mockups con PhoneFrame + contenido real
5. Actualizar Testimonials: agregar ChatPreview a cada card

## Próximo paso
Cuando existan capturas PNG reales, reemplazar el contenido del PhoneFrame por `<img src="...">`. La estructura del frame no cambia.
