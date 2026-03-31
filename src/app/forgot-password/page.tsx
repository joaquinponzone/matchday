"use client"

import Link from "next/link"
import { useActionState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { forgotPassword } from "./actions"

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(forgotPassword, {})

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Restablecer contraseña</CardTitle>
        </CardHeader>
        <CardContent>
          {state?.success ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{state.success}</p>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  Volver al inicio de sesión
                </Button>
              </Link>
            </div>
          ) : (
            <>
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
                {state?.error && (
                  <p className="text-sm text-destructive">{state.error}</p>
                )}
                <Button type="submit" className="w-full" disabled={pending}>
                  {pending ? "Enviando…" : "Enviar enlace"}
                </Button>
              </form>
              <div className="mt-4 text-sm">
                <Link
                  href="/login"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Volver al inicio de sesión
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
