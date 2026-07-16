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

interface Conference {
  id: string
  name_ru: string
  name_kk: string
  name_en: string
}

interface Committee {
  id: string
  name: string
  topic: string | null
}

export default function ApplyToConferencePage() {
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
    motivation: "",
    primary_choice: "",
    secondary_choice: "",
    third_choice: "",
  })

  useEffect(() => {
    loadConferenceAndUser()
  }, [params.id])

  async function loadConferenceAndUser() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      // Load conference
      const { data: confData, error: confError } = await supabase
        .from("user_conferences")
        .select("id, name_ru, name_kk, name_en")
        .eq("id", params.id)
        .single()

      if (confError) throw confError
      setConference(confData)

      const { data: committeesData, error: committeesError } = await supabase
        .from("conference_committees")
        .select("*")
        .eq("conference_id", params.id)
        .order("created_at", { ascending: true })

      if (committeesError) throw committeesError
      setCommittees(committeesData || [])

      // Load user profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("user_id", user.id)
        .single()

      // Check if already applied
      const { data: existingApp } = await supabase
        .from("delegate_applications")
        .select("id")
        .eq("conference_id", params.id)
        .eq("user_id", user.id)
        .maybeSingle()

      if (existingApp) {
        setError(t("already_applied"))
      }

      setFormData({
        ...formData,
        full_name: profileData?.full_name || "",
        email: user.email || "",
        phone: profileData?.phone || "",
      })
    } catch (error) {
      console.error("[v0] Error loading:", error)
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
      if (committees.length > 0) {
        if (!formData.primary_choice) {
          setError(t("select_committee") + " (" + t("primary_choice") + ")")
          setSubmitting(false)
          return
        }
        if (!formData.secondary_choice) {
          setError(t("select_committee") + " (" + t("secondary_choice") + ")")
          setSubmitting(false)
          return
        }
        if (!formData.third_choice) {
          setError(t("select_committee") + " (" + t("third_choice") + ")")
          setSubmitting(false)
          return
        }
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { error: insertError } = await supabase.from("delegate_applications").insert({
        conference_id: params.id as string,
        user_id: user.id,
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone || "",
        motivation: formData.motivation,
        primary_committee_id: formData.primary_choice || null,
        secondary_committee_id: formData.secondary_choice || null,
        third_committee_id: formData.third_choice || null,
        status: "pending",
      })

      if (insertError) throw insertError

      alert(t("application_submitted"))
      router.push("/dashboard")
    } catch (error) {
      console.error("[v0] Error submitting application:", error)
      setError((error as Error).message)
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
              <CardTitle>{t("delegate_registration")}</CardTitle>
              <CardDescription>{conferenceName}</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 rounded-lg">
                  {error}
                </div>
              )}

              {committees.length === 0 && (
                <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 rounded-lg">
                  {t("no_committees")}
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
                  <Label htmlFor="email">
                    {t("email")} <span className="text-red-500">*</span>
                  </Label>
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

                {committees.length > 0 && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="primary_choice">
                        {t("primary_choice")} <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.primary_choice}
                        onValueChange={(value) => setFormData({ ...formData, primary_choice: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("select_committee")} />
                        </SelectTrigger>
                        <SelectContent>
                          {committees.map((committee) => (
                            <SelectItem key={committee.id} value={committee.id}>
                              {committee.name}
                              {committee.topic && ` - ${committee.topic}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="secondary_choice">
                        {t("secondary_choice")} <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.secondary_choice}
                        onValueChange={(value) => setFormData({ ...formData, secondary_choice: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("select_committee")} />
                        </SelectTrigger>
                        <SelectContent>
                          {committees
                            .filter((c) => c.id !== formData.primary_choice)
                            .map((committee) => (
                              <SelectItem key={committee.id} value={committee.id}>
                                {committee.name}
                                {committee.topic && ` - ${committee.topic}`}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="third_choice">
                        {t("third_choice")} <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.third_choice}
                        onValueChange={(value) => setFormData({ ...formData, third_choice: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("select_committee")} />
                        </SelectTrigger>
                        <SelectContent>
                          {committees
                            .filter((c) => c.id !== formData.primary_choice && c.id !== formData.secondary_choice)
                            .map((committee) => (
                              <SelectItem key={committee.id} value={committee.id}>
                                {committee.name}
                                {committee.topic && ` - ${committee.topic}`}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="motivation">{t("motivation")}</Label>
                  <Textarea
                    id="motivation"
                    value={formData.motivation}
                    onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                    placeholder={t("why_you")}
                    rows={6}
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    className="flex-1 bg-[#006633] hover:bg-[#004d26]"
                    disabled={submitting || committees.length === 0}
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
