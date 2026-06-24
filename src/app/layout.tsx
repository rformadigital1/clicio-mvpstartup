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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;1,700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  )
}
