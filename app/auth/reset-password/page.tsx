"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useLanguage } from "@/contexts/language-context"
import { createBrowserClient } from "@/lib/supabase/client"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [checked, setChecked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { t } = useLanguage()

  useEffect(() => {
    const supabase = createBrowserClient()
    // The recovery link puts a session token in the URL; @supabase/ssr picks it
    // up automatically. Detect the resulting session / PASSWORD_RECOVERY event.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setReady(true)
        setChecked(true)
      }
    })
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
      setChecked(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError(t("password_hint"))
      return
    }
    if (password !== confirm) {
      setError(t("passwords_dont_match"))
      return
    }

    setIsLoading(true)
    try {
      const supabase = createBrowserClient()
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      alert(t("password_updated"))
      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error_generic"))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-200px)] w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{t("reset_password_title")}</CardTitle>
            <CardDescription>{t("password_hint")}</CardDescription>
          </CardHeader>
          <CardContent>
            {checked && !ready ? (
              <div className="space-y-4 text-center">
                <p className="text-sm text-red-500">{t("reset_link_invalid")}</p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/auth/forgot-password">{t("forgot_password_title")}</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="password">{t("new_password")}</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirm">{t("confirm_password")}</Label>
                    <Input
                      id="confirm"
                      type="password"
                      required
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                    />
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={isLoading || !ready}
                  >
                    {isLoading ? t("saving") : t("update_password")}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
