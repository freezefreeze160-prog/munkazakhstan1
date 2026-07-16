"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useLanguage } from "@/contexts/language-context"
import { signUpAction } from "@/lib/auth-actions"

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const validatePassword = (password: string): { valid: boolean; error?: string } => {
  if (password.length < 6) {
    return { valid: false, error: "error_password_short" }
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return { valid: false, error: "error_password_weak" }
  }
  return { valid: true }
}

const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^(\+7|8)?[0-9]{10,11}$/
  return phoneRegex.test(phone.replace(/[\s\-()]/g, ""))
}

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { t } = useLanguage()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (!fullName.trim()) {
        throw new Error(t("error_name_required"))
      }

      if (!validateEmail(email)) {
        throw new Error(t("error_email_invalid"))
      }

      const passwordValidation = validatePassword(password)
      if (!passwordValidation.valid) {
        throw new Error(t(passwordValidation.error as any))
      }

      if (!validatePhone(phone)) {
        throw new Error(t("error_phone_invalid"))
      }

      const result = await signUpAction(email, password, fullName, phone)
      if (result.success) {
        router.push("/auth/sign-up-success")
      } else {
        setError(result.error ? t(result.error as any) : t("error_creating_account"))
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError(t("error_generic"))
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-200px)] w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{t("sign_up")}</CardTitle>
            <CardDescription>{t("sign_up_desc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="fullName">{t("full_name")}</Label>
                  <Input
                    id="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">{t("email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">{t("phone")} *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+7 (___) ___-__-__"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">{t("password")}</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("password_hint")}
                  </p>
                </div>

                {error && (
                  <div className="rounded-md bg-red-50 dark:bg-red-950 p-3 border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
                  </div>
                )}
                <Button type="submit" className="w-full bg-[#006633] hover:bg-[#004d26]" disabled={isLoading}>
                  {isLoading ? t("creating_account") : t("sign_up")}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                {t("have_account")}{" "}
                <Link href="/auth/login" className="underline underline-offset-4 text-primary">
                  {t("login")}
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
