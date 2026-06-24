import type { BookingStatus } from "@/lib/types"

export const STATUS_LABELS: Record<BookingStatus, string> = {
  reserved: "Reservado",
  waiting: "Esperando",
  in_progress: "En progreso",
  ready: "Listo",
  delivered: "Entregado",
  cancelled: "Anulado",
}

export const STATUS_COLORS: Record<BookingStatus, string> = {
  reserved: "#dbeafe",
  waiting: "#fef3c7",
  in_progress: "#fee2e2",
  ready: "#dcfce7",
  delivered: "#f3f4f6",
  cancelled: "#e5e7eb",
}

export const STATUS_TEXT_COLORS: Record<BookingStatus, string> = {
  reserved: "#1a3a8a",
  waiting: "#b45309",
  in_progress: "#e3242b",
  ready: "#166534",
  delivered: "#4b5563",
  cancelled: "#6b7280",
}

export const STATUS_BADGE_CLASSES: Record<BookingStatus, string> = {
  reserved: "bg-azul-rey/10 text-azul-rey",
  waiting: "bg-amber-100 text-amber-800",
  in_progress: "bg-rojo/10 text-rojo",
  ready: "bg-green-100 text-green-800",
  delivered: "bg-gray-100 text-gray-700",
  cancelled: "bg-gray-200 text-gray-500",
}
