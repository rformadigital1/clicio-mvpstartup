# Calendario: Header simplificado + Lista de reservas + Exportar CSV

## Contexto
El calendario actual tiene grilla semanal funcional pero:
- Header confuso (flechas, "Hoy", rango de fechas mal dispuesto)
- No hay vista de lista como la vieja Agenda
- No hay exportación de datos

## Header

```
[<]  22 - 28 junio 2026  [>]  [Hoy]    [+ Nueva Reserva]
```

- Flecha izquierda/derecha navega semana
- Rango de fechas en formato corto `D - D MES AÑO`
- "Hoy" vuelve a la semana actual
- "+ Nueva Reserva" abre modal de creación

## Lista de reservas (debajo de la grilla)

Misma data de la semana activa. Actualiza al navegar semanas.

### Filtros
- **Búsqueda**: por cliente, teléfono o patente
- **Filtro de estado**: Todos / Reservado / Esperando / En progreso / Listo / Entregado
- **Exportar CSV**: descarga las reservas visibles (filtradas) de la semana

### Columnas de la tabla

| Hora | Cliente | Vehículo | Servicio | Estado |
|------|---------|----------|----------|--------|
| 08:00 | Juan Pérez | ABC-123 | Cambio aceite | En progreso |

- Cada fila es clickeable → abre modal detalle (reutiliza el existente)
- Estados con colores (misma paleta que la grilla)

### Exportar CSV
- Descarga archivo con columnas: Fecha, Hora, Cliente, Teléfono, Vehículo, Servicios, Estado
- Nombre del archivo: `reservas-semana-YYYY-MM-DD.csv`
- Solo incluye reservas visibles (filtradas)

## No cambia
- Grilla semanal (horas a izquierda, días arriba, cuadraditos)
- Modales de crear, detalle, editar
- Navegación: lista sincronizada con semana activa

## Data flow
```
loadWeek() → bookings[] → filtered semanal
                              ├── grilla (existing)
                              ├── lista (nuevo, filteredBookings)
                              └── CSV (nuevo, filteredBookings)
```
