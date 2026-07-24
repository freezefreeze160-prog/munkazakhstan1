"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { createBrowserClient } from "@/lib/supabase/client"
import { useLanguage } from "@/contexts/language-context"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { REGIONS } from "@/lib/roles"
import { ArrowLeft, Plus } from "lucide-react"

export default function EditConferencePage() {
  const params = useParams()
  const router = useRouter()
  const { t, language } = useLanguage()
  const supabase = createBrowserClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [allowed, setAllowed] = useState(false)
  const [posterUploading, setPosterUploading] = useState(false)
  const [form, setForm] = useState({
    name: "",
    date: "",
    time: "",
    location: "",
    region: "",
    description: "",
    conditions: "",
    organizer_contact: "",
    registration_fee_amount: "",
    registration_fee_currency: "KZT",
    payment_bank: "",
    payment_card_number: "",
    payment_card_holder: "",
    payment_instructions: "",
    poster_url: "",
    languages: [] as string[],
    registration_open: true,
    registration_deadline: "",
    presidium_registration_open: false,
  })

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  async function load() {
    try {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: conf, error } = await supabase
        .from("user_conferences")
        .select("*")
        .eq("id", params.id)
        .single()
      if (error || !conf) {
        router.push("/conferences")
        return
      }

      const isCreator = conf.creator_id === user.id
      const isAssigned = conf.assigned_deputy_id === user.id
      let elevated = false
      if (!isCreator && !isAssigned) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle()
        elevated = profile?.role === "founder" || profile?.role === "admin"
      }
      if (!isCreator && !isAssigned && !elevated) {
        setAllowed(false)
        setLoading(false)
        return
      }
      setAllowed(true)

      setForm({
        name: conf.name_ru || "",
        date: conf.date_ru || "",
        time: conf.time || "",
        location: conf.location || "",
        region: conf.city || "",
        description: conf.description_ru || "",
        conditions: conf.conditions_ru || "",
        organizer_contact: conf.organizer_contact || "",
        registration_fee_amount: conf.registration_fee_amount != null ? String(conf.registration_fee_amount) : "",
        registration_fee_currency: conf.registration_fee_currency || "KZT",
        payment_bank: conf.payment_bank || "",
        payment_card_number: conf.payment_card_number || "",
        payment_card_holder: conf.payment_card_holder || "",
        payment_instructions: conf.payment_instructions || "",
        poster_url: conf.poster_url || "",
        languages: conf.languages || [],
        registration_open: conf.registration_open !== false,
        registration_deadline: conf.registration_deadline
          ? String(conf.registration_deadline).slice(0, 10)
          : "",
        presidium_registration_open: conf.presidium_registration_open === true,
      })
    } catch (err) {
      console.error("Error loading conference for edit:", err)
      router.push("/conferences")
    } finally {
      setLoading(false)
    }
  }

  async function handlePosterUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPosterUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("folder", "posters")
      const res = await fetch("/api/upload-blob", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")
      setForm((f) => ({ ...f, poster_url: data.url }))
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setPosterUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const { error } = await supabase
        .from("user_conferences")
        .update({
          name_ru: form.name,
          name_kk: form.name,
          name_en: form.name,
          date_ru: form.date,
          date_kk: form.date,
          date_en: form.date,
          time: form.time,
          location: form.location,
          city: form.region,
          description_ru: form.description,
          description_kk: form.description,
          description_en: form.description,
          conditions_ru: form.conditions,
          conditions_kk: form.conditions,
          conditions_en: form.conditions,
          organizer_contact: form.organizer_contact,
          registration_fee_amount: form.registration_fee_amount
            ? Number.parseFloat(form.registration_fee_amount)
            : null,
          registration_fee_currency: form.registration_fee_currency,
          payment_bank: form.payment_bank || null,
          payment_card_number: form.payment_card_number || null,
          payment_card_holder: form.payment_card_holder || null,
          payment_instructions: form.payment_instructions || null,
          poster_url: form.poster_url || null,
          languages: form.languages,
          registration_open: form.registration_open,
          registration_deadline: form.registration_deadline || null,
          presidium_registration_open: form.presidium_registration_open,
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.id)
      if (error) throw error
      alert(t("conference_updated"))
      router.push(`/conferences/${params.id}`)
    } catch (err) {
      console.error("Error updating conference:", err)
      alert("Error: " + (err as Error).message)
    } finally {
      setSaving(false)
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

  if (!allowed) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <p className="text-destructive font-medium">{t("access_denied")}</p>
            <Button asChild variant="outline">
              <Link href={`/conferences/${params.id}`}>{t("back_to_conference")}</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <Button asChild variant="ghost" className="mb-6 -ml-2">
            <Link href={`/conferences/${params.id}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("back_to_conference")}
            </Link>
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>{t("edit_conference")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Poster */}
                <div className="grid gap-2">
                  <Label>{t("conference_poster")}</Label>
                  <div className="flex items-center gap-4">
                    <div className="w-28 h-40 rounded-lg overflow-hidden bg-muted flex items-center justify-center flex-shrink-0 border">
                      {form.poster_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={form.poster_url} alt="poster" className="w-full h-full object-cover" />
                      ) : (
                        <Plus className="w-8 h-8 text-muted-foreground/40" />
                      )}
                    </div>
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="poster-edit"
                        onChange={handlePosterUpload}
                        disabled={posterUploading}
                      />
                      <Button asChild type="button" variant="outline" size="sm" disabled={posterUploading}>
                        <label htmlFor="poster-edit" className="cursor-pointer">
                          {posterUploading ? t("uploading") : t("change_poster")}
                        </label>
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>{t("conference_name")}</Label>
                  <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>{t("conference_date")}</Label>
                    <Input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("conference_time")}</Label>
                    <Input
                      type="time"
                      value={form.time}
                      onChange={(e) => setForm({ ...form, time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>{t("region")}</Label>
                  <Select value={form.region} onValueChange={(v) => setForm({ ...form, region: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("select_city")} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(REGIONS).map(([num, names]) => (
                        <SelectItem key={num} value={num}>
                          {names[language]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>{t("conference_location")}</Label>
                  <Input
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>{t("organizer_contact")}</Label>
                  <Input
                    value={form.organizer_contact}
                    onChange={(e) => setForm({ ...form, organizer_contact: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 grid gap-2">
                    <Label>{t("registration_fee")}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.registration_fee_amount}
                      onChange={(e) => setForm({ ...form, registration_fee_amount: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>KZT</Label>
                    <Select
                      value={form.registration_fee_currency}
                      onValueChange={(v) => setForm({ ...form, registration_fee_currency: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KZT">KZT</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Payment details */}
                <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                  <Label className="text-base font-semibold">{t("payment_details")}</Label>
                  <div className="grid gap-2">
                    <Label className="text-sm">{t("payment_bank")}</Label>
                    <Input
                      value={form.payment_bank}
                      onChange={(e) => setForm({ ...form, payment_bank: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-sm">{t("payment_card_number")}</Label>
                    <Input
                      value={form.payment_card_number}
                      onChange={(e) => setForm({ ...form, payment_card_number: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-sm">{t("payment_card_holder")}</Label>
                    <Input
                      value={form.payment_card_holder}
                      onChange={(e) => setForm({ ...form, payment_card_holder: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-sm">{t("payment_instructions")}</Label>
                    <Textarea
                      value={form.payment_instructions}
                      onChange={(e) => setForm({ ...form, payment_instructions: e.target.value })}
                      rows={2}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>{t("conference_languages")}</Label>
                  <div className="flex gap-4">
                    {["Русский", "Қазақша", "English"].map((lang) => (
                      <label key={lang} className="flex items-center gap-2">
                        <Checkbox
                          checked={form.languages.includes(lang)}
                          onCheckedChange={(checked) => {
                            if (checked) setForm({ ...form, languages: [...form.languages, lang] })
                            else setForm({ ...form, languages: form.languages.filter((l) => l !== lang) })
                          }}
                        />
                        <span className="text-sm">{lang}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>{t("conference_description")}</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>{t("conference_conditions")}</Label>
                  <Textarea
                    value={form.conditions}
                    onChange={(e) => setForm({ ...form, conditions: e.target.value })}
                    rows={4}
                  />
                </div>

                {/* Registration control */}
                <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-semibold">{t("registration_open_label")}</Label>
                      <p className="text-xs text-muted-foreground mt-1">{t("registration_open_hint")}</p>
                    </div>
                    <Switch
                      checked={form.registration_open}
                      onCheckedChange={(v) => setForm({ ...form, registration_open: v })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-sm">{t("registration_deadline")}</Label>
                    <Input
                      type="date"
                      value={form.registration_deadline}
                      onChange={(e) => setForm({ ...form, registration_deadline: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">{t("registration_deadline_hint")}</p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      <Label className="text-base font-semibold">{t("presidium_registration_label")}</Label>
                      <p className="text-xs text-muted-foreground mt-1">{t("presidium_registration_hint")}</p>
                    </div>
                    <Switch
                      checked={form.presidium_registration_open}
                      onCheckedChange={(v) => setForm({ ...form, presidium_registration_open: v })}
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90" disabled={saving}>
                    {saving ? t("saving") : t("save_changes")}
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
