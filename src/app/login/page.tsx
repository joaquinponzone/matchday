"use client"

import Link from "next/link"
import { useActionState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { login } from "./actions"

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, {})

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Matchday</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                autoFocus
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            {state?.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Ingresando…" : "Ingresar"}
            </Button>
          </form>
          <div className="mt-4 flex items-center justify-between text-sm">
            <Link
              href="/register"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Crear una cuenta
            </Link>
            {state?.emailConfigured && (
              <Link
                href="/forgot-password"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
