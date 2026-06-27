import Link from "next/link"

export default function SuspendedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="max-w-md text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto">
          <span className="text-2xl">⏸</span>
        </div>
        <h1 className="text-2xl font-bold">Cuenta en pausa</h1>
        <p className="text-muted-foreground leading-relaxed">
          Tu período de prueba gratuita terminó. Para seguir usando CLICIO, contacta a tu asesor y
          regulariza tu situación.
        </p>
        <a
          href="https://wa.me/56912345678"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          Contactar por WhatsApp
        </a>
        <p className="text-xs text-muted-foreground">
          Tus datos están seguros. Nada se elimina. Al activar tu plan, todo vuelve a estar disponible.
        </p>
      </div>
    </div>
  )
}
