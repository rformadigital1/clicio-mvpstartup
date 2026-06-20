"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SignUpPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = new FormData(e.currentTarget)
    const email = form.get("email") as string
    const password = form.get("password") as string
    const tallerNombre = form.get("tallerNombre") as string
    const tallerUrl = form.get("tallerUrl") as string

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          taller_nombre: tallerNombre,
          taller_url: tallerUrl,
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    router.push("/signin?check_email=true")
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="text-xl font-bold block mb-2">CLICIO</Link>
          <CardTitle>Crear cuenta</CardTitle>
          <CardDescription>Configura tu taller en minutos</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tallerNombre">Nombre del taller</Label>
              <Input id="tallerNombre" name="tallerNombre" required placeholder="Ej: Taller Mecánico Pérez" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tallerUrl">URL del taller</Label>
              <Input id="tallerUrl" name="tallerUrl" required placeholder="taller-perez" />
              <p className="text-xs text-muted-foreground">taller.clicio.cl/<b>taller-perez</b></p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required placeholder="taller@ejemplo.cl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" name="password" type="password" required minLength={6} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link href="/signin" className="text-primary hover:underline">Acceder</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
