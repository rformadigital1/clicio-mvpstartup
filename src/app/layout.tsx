import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "CLICIO - Web + Agenda + Fidelización para talleres",
  description: "Más clientes. Más reservas. Más recompra. Todo desde una sola plataforma.",
  icons: [{ url: "/favicon.svg", type: "image/svg+xml" }],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  )
}
