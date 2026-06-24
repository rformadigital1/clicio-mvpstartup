"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Info, Clock, Image, UsersRound, Palette } from "lucide-react"

const settingsTabs = [
  { href: "/dashboard/settings/taller", label: "Taller", icon: Info },
  { href: "/dashboard/settings/horarios", label: "Horarios", icon: Clock },
  { href: "/dashboard/settings/galeria", label: "Galería", icon: Image },
  { href: "/dashboard/settings/equipo", label: "Equipo", icon: UsersRound },
  { href: "/dashboard/settings/apariencia", label: "Apariencia", icon: Palette },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Configuración</h1>
      <nav className="flex gap-1 mb-6 pb-1 border-b border-border-subtil overflow-x-auto">
        {settingsTabs.map((tab) => {
          const isActive = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                isActive
                  ? "border-azul-rey text-azul-rey"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border-medio"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </Link>
          )
        })}
      </nav>
      <div className="max-w-2xl">{children}</div>
    </div>
  )
}
