import type { BookingStatus } from "@/lib/types"

export const STATUS_LABELS: Record<BookingStatus, string> = {
  reserved: "Reservado",
  waiting: "Esperando",
  in_progress: "En progreso",
  ready: "Listo",
  delivered: "Entregado",
}

export const STATUS_COLORS: Record<BookingStatus, string> = {
  reserved: "#dbeafe",
  waiting: "#fef3c7",
  in_progress: "#fed7aa",
  ready: "#bbf7d0",
  delivered: "#e5e7eb",
}

export const STATUS_TEXT_COLORS: Record<BookingStatus, string> = {
  reserved: "#1e40af",
  waiting: "#92400e",
  in_progress: "#9a3412",
  ready: "#166534",
  delivered: "#374151",
}

export const STATUS_BADGE_CLASSES: Record<BookingStatus, string> = {
  reserved: "bg-blue-100 text-blue-800",
  waiting: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-orange-100 text-orange-800",
  ready: "bg-green-100 text-green-800",
  delivered: "bg-gray-100 text-gray-800",
}
