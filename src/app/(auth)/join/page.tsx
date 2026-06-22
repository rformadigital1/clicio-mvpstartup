"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

function JoinForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = searchParams.get("code") || ""
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!code) { setError("Código de invitación inválido"); setLoading(false); return }

    const form = new FormData(e.currentTarget)
    const email = form.get("email") as string
    const password = form.get("password") as string

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { invite_code: code },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    router.push("/signin?staff_ok=true")
  }

  if (!code) {
    return (
    <div className="min-h-screen flex items-center justify-center p-4 animated-gradient">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Link href="/" className="text-xl font-bold block mb-2">CLICIO</Link>
            <CardTitle>Código requerido</CardTitle>
            <CardDescription>Necesitas un código de invitación para unirte a un taller.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animated-gradient">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="text-xl font-bold block mb-2">CLICIO</Link>
          <CardTitle>Unirse al taller</CardTitle>
          <CardDescription>Ingresa tus datos para acceder al sistema del taller.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required placeholder="empleado@ejemplo.cl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" name="password" type="password" required minLength={6} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creando cuenta..." : "Unirse al taller"}
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

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Cargando...</p></div>}>
      <JoinForm />
    </Suspense>
  )
}
