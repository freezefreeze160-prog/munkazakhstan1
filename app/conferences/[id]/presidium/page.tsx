"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { createBrowserClient } from "@/lib/supabase/client"
import { useLanguage } from "@/contexts/language-context"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import { PRESIDIUM_POSITIONS, presidiumPositionKey } from "@/lib/presidium"

interface Conference {
  id: string
  name_ru: string
  name_kk: string
  name_en: string
  presidium_registration_open: boolean | null
}

interface Committee {
  id: string
  name: string
}

export default function PresidiumApplyPage() {
  const params = useParams()
  const router = useRouter()
  const { t, language } = useLanguage()
  const supabase = createBrowserClient()
  const [conference, setConference] = useState<Conference | null>(null)
  const [committees, setCommittees] = useState<Committee[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    position: "",
    committee_id: "",
    motivation: "",
    experience: "",
  })

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  async function load() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: conf, error: confError } = await supabase
        .from("user_conferences")
        .select("id, name_ru, name_kk, name_en, presidium_registration_open")
        .eq("id", params.id)
        .single()
      if (confError) throw confError
      setConference(conf)

      const { data: comms } = await supabase
        .from("conference_committees")
        .select("id, name")
        .eq("conference_id", params.id)
        .order("priority", { ascending: true })
      setCommittees(comms || [])

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("user_id", user.id)
        .single()

      const { data: existing } = await supabase
        .from("presidium_applications")
        .select("id")
        .eq("conference_id", params.id)
        .eq("user_id", user.id)
        .maybeSingle()
      if (existing) setError(t("already_applied"))

      setFormData((prev) => ({
        ...prev,
        full_name: profile?.full_name || "",
        email: user.email || "",
        phone: profile?.phone || "",
      }))
    } catch (err) {
      console.error("[presidium] load error:", err)
      setError(t("load_error_conference"))
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError("")
    try {
      if (!formData.position) throw new Error(t("presidium_pick_position"))
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { error: insertError } = await supabase.from("presidium_applications").insert({
        conference_id: params.id as string,
        user_id: user.id,
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone || "",
        position: formData.position,
        committee_id: formData.committee_id || null,
        motivation: formData.motivation,
        experience: formData.experience,
        status: "pending",
      })
      if (insertError) throw insertError

      alert(t("application_submitted"))
      router.push("/dashboard")
    } catch (err) {
      console.error("[presidium] submit error:", err)
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">{t("loading")}</p>
        </main>
        <Footer />
      </div>
    )
  }

  if (!conference) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">{t("conference_not_found")}</p>
        </main>
        <Footer />
      </div>
    )
  }

  const conferenceName =
    language === "ru" ? conference.name_ru : language === "kk" ? conference.name_kk : conference.name_en
  const closed = conference.presidium_registration_open === false
  const alreadyApplied = error === t("already_applied")

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <Button asChild variant="ghost" className="mb-6">
            <Link href={`/conferences/${params.id}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("back_to_conference")}
            </Link>
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>{t("presidium_registration")}</CardTitle>
              <CardDescription>{conferenceName}</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 rounded-lg">
                  {error}
                </div>
              )}
              {closed && (
                <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 rounded-lg">
                  {t("presidium_closed")}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="full_name">
                    {t("full_name")} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="full_name"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">{t("email")}</Label>
                  <Input id="email" type="email" required value={formData.email} readOnly className="bg-muted" />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="phone">
                    {t("phone")} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+7XXXXXXXXXX"
                  />
                </div>

                <div className="grid gap-2">
                  <Label>
                    {t("presidium_position")} <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.position}
                    onValueChange={(v) => setFormData({ ...formData, position: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("presidium_pick_position")} />
                    </SelectTrigger>
                    <SelectContent>
                      {PRESIDIUM_POSITIONS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {t(presidiumPositionKey(p) as never)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {committees.length > 0 && (
                  <div className="grid gap-2">
                    <Label>
                      {t("presidium_committee")}{" "}
                      <span className="text-xs text-muted-foreground font-normal">({t("optional")})</span>
                    </Label>
                    <Select
                      value={formData.committee_id || "none"}
                      onValueChange={(v) => setFormData({ ...formData, committee_id: v === "none" ? "" : v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("select_committee")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">—</SelectItem>
                        {committees.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="experience">{t("presidium_experience")}</Label>
                  <Textarea
                    id="experience"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    placeholder={t("presidium_experience_ph")}
                    rows={4}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="motivation">{t("motivation")}</Label>
                  <Textarea
                    id="motivation"
                    value={formData.motivation}
                    onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                    placeholder={t("why_you")}
                    rows={4}
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary/90"
                    disabled={submitting || closed || alreadyApplied}
                  >
                    {submitting ? t("submitting") : t("submit")}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
                    {t("cancel")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
