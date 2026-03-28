"use client"

import Link from "next/link"
import { useActionState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { register } from "./actions"

export default function RegisterPage() {
  const [state, action, pending] = useActionState(register, {})

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Create account</CardTitle>
        </CardHeader>
        <CardContent>
          {state?.success ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{state.success}</p>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  Back to login
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <form action={action} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" autoFocus required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" autoComplete="email" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                  />
                </div>
                {state?.error && (
                  <p className="text-sm text-destructive">{state.error}</p>
                )}
                <Button type="submit" className="w-full" disabled={pending}>
                  {pending ? "Creating…" : "Create account"}
                </Button>
              </form>
              <div className="mt-4 text-sm">
                <Link
                  href="/login"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Already have an account? Sign in
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
