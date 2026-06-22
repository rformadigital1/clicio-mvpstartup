export interface Tenant {
  id: string
  name: string
  slug: string
  logo_url: string | null
  address: string | null
  phone: string | null
  email: string | null
  instagram: string | null
  page_config: PageConfig | null
  created_at: string
  deposit_enabled?: boolean
  deposit_type?: "percent" | "fixed" | null
  deposit_value?: number | null
}

export interface Profile {
  id: string
  tenant_id: string
  email: string
  role: "owner" | "staff"
  created_at: string
}

export interface BookingService {
  id: string
  booking_id: string
  service_id: string
  services?: Service
}

export interface Vehicle {
  id: string
  tenant_id: string
  customer_id: string
  plate: string
  brand: string | null
  model: string | null
  year: number | null
  vin: string | null
  created_at: string
}

export interface Customer {
  id: string
  tenant_id: string
  name: string
  phone: string | null
  vehicle: string | null
  plate: string | null
  stamps: number
  created_at: string
}

export interface Service {
  id: string
  tenant_id: string
  name: string
  price: number | null
  duration: number | null
  created_at: string
}

export interface Booking {
  id: string
  tenant_id: string
  customer_id: string
  service_id?: string
  vehicle_id?: string
  booking_date: string
  booking_time: string
  status: BookingStatus
  created_at: string
  customers?: Customer
  services?: Service
  vehicles?: Vehicle
  booking_services?: BookingService[]
}

export type BookingStatus = "reserved" | "waiting" | "in_progress" | "ready" | "delivered"

export interface LoyaltyRule {
  id: string
  tenant_id: string
  required_stamps: number
  reward_name: string
  created_at: string
}

export interface StampHistory {
  id: string
  tenant_id: string
  customer_id: string
  booking_id: string | null
  created_at: string
}

export interface BusinessHour {
  id: string
  tenant_id: string
  day_of_week: number
  open_time: string
  close_time: string
  is_open: boolean
}

export interface BlockedDate {
  id: string
  tenant_id: string
  date: string
  reason: string | null
}

export interface GalleryImage {
  id: string
  tenant_id: string
  image_url: string
  created_at: string
}

export interface StaffInvitation {
  id: string
  tenant_id: string
  code: string
  used: boolean
  created_at: string
  expires_at: string
}

export interface PageConfig {
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    cardBg: string
    text: string
    buttonBg: string
    buttonText: string
  }
  typography: {
    headingFont: string
    bodyFont: string
  }
  sections: {
    id: "quick-buttons" | "services" | "booking-wizard" | "gallery" | "map"
    visible: boolean
    order: number
  }[]
  buttons: {
    whatsapp: { visible: boolean; label: string }
    instagram: { visible: boolean; label: string }
    servicios: { visible: boolean; label: string }
    agendar: { visible: boolean; label: string }
  }
}
