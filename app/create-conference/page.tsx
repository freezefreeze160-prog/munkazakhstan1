"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/contexts/language-context"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { REGIONS } from "@/lib/roles"
import { Home, Plus, X } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"

interface Committee {
  id?: string
  name: string
  topic: string
  capacity: number
  priority: number
  countries: string[]
  languages: string[] // Added languages field for committees
}

export default function CreateConferencePage() {
  const { t, language } = useLanguage()
  const router = useRouter()
  const supabase = createBrowserClient()

  const [loading, setLoading] = useState(true)
  const [canCreate, setCanCreate] = useState(false)
  const [userRole, setUserRole] = useState<string>("")
  const [myConferences, setMyConferences] = useState<any[]>([])
  const [myDeputies, setMyDeputies] = useState<any[]>([])
  const [selectedDeputy, setSelectedDeputy] = useState<string>("")
  const [committees, setCommittees] = useState<Committee[]>([
    { name: "", topic: "", capacity: 15, priority: 1, countries: [], languages: [] },
  ])
  const [formData, setFormData] = useState({
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
    languages: [] as string[],
  })

  useEffect(() => {
    checkPermissions()
  }, [])

  async function checkPermissions() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).single()

      // Only Founder and General Secretary can create conferences
      // Deputies are assigned by their supervisors, not create themselves
      const allowed =
        profile?.role === "founder" ||
        profile?.role === "general_secretary"

      setCanCreate(allowed)
      setUserRole(profile?.role || "")

      // If General Secretary, load their deputies
      if (profile?.role === "general_secretary") {
        const { data: deputies } = await supabase
          .from("profiles")
          .select("user_id, full_name, region")
          .eq("supervisor_id", user.id)
          .eq("role", "deputy")

        setMyDeputies(deputies || [])
      }

      if (!allowed) {
        alert(t("no_permission_create_conference"))
        router.push("/")
      }

      if (allowed) {
        const { data: conferences } = await supabase
          .from("user_conferences")
          .select("*")
          .order("created_at", { ascending: false })

        setMyConferences(conferences || [])
      }
    } catch (error) {
      console.error("[v0] Error checking permissions:", error)
      router.push("/")
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteConference(conferenceId: string, conferenceName: string) {
    if (!confirm(`${t("confirm_delete_conference")}\n\n${conferenceName}`)) {
      return
    }

    try {
      const { error } = await supabase.from("user_conferences").delete().eq("id", conferenceId)

      if (error) throw error

      alert(t("conference_deleted"))
      setMyConferences(myConferences.filter((c) => c.id !== conferenceId))
    } catch (error) {
      console.error("[v0] Error deleting conference:", error)
      alert("Error deleting conference: " + (error as Error).message)
    }
  }

  function addCommittee() {
    setCommittees([
      ...committees,
      { name: "", topic: "", capacity: 15, priority: committees.length + 1, countries: [], languages: [] },
    ])
  }

  function removeCommittee(index: number) {
    if (committees.length > 1) {
      setCommittees(committees.filter((_, i) => i !== index))
    }
  }

  function updateCommitteeField(index: number, field: keyof Committee, value: string | number | string[]) {
    const updated = [...committees]
    updated[index][field] = value as any
    setCommittees(updated)
  }

  function addCountryToCommittee(committeeIndex: number) {
    const countryName = prompt(t("country_name"))
    if (countryName && countryName.trim()) {
      const updated = [...committees]
      updated[committeeIndex].countries = [...updated[committeeIndex].countries, countryName.trim()]
      setCommittees(updated)
    }
  }

  function removeCountryFromCommittee(committeeIndex: number, countryIndex: number) {
    const updated = [...committees]
    updated[committeeIndex].countries = updated[committeeIndex].countries.filter((_, i) => i !== countryIndex)
    setCommittees(updated)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const validCommittees = committees.filter((c) => c.name.trim() !== "")
    if (validCommittees.length === 0) {
      alert(t("at_least_one_committee"))
      return
    }

    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const status = userRole === "founder" ? "published" : "pending"
      const approvalRequired = userRole === "general_secretary" // Gen Sec conferences need approval

      const { data: conferenceData, error: confError } = await supabase
        .from("user_conferences")
        .insert({
          name_ru: formData.name,
          name_kk: formData.name,
          name_en: formData.name,
          date_ru: formData.date,
          date_kk: formData.date,
          date_en: formData.date,
          time: formData.time,
          location: formData.location,
          city: formData.region,
          description_ru: formData.description,
          description_kk: formData.description,
          description_en: formData.description,
          creator_id: user.id,
          organizer_contact: formData.organizer_contact,
          registration_fee_amount: formData.registration_fee_amount
            ? Number.parseFloat(formData.registration_fee_amount)
            : null,
          registration_fee_currency: formData.registration_fee_currency,
          payment_bank: formData.payment_bank || null,
          payment_card_number: formData.payment_card_number || null,
          payment_card_holder: formData.payment_card_holder || null,
          payment_instructions: formData.payment_instructions || null,
          languages: formData.languages,
          status: status,
          assigned_deputy_id: selectedDeputy || null,
          approval_required: approvalRequired,
        })
        .select()
        .single()

      if (confError) throw confError

      const committeesToInsert = validCommittees.map((c) => ({
        conference_id: conferenceData.id,
        name: c.name,
        topic: c.topic || null,
        capacity: c.capacity,
        priority: c.priority,
        countries: c.countries,
        languages: c.languages,
      }))

      const { error: committeeError } = await supabase.from("conference_committees").insert(committeesToInsert)

      if (committeeError) throw committeeError

      if (status === "pending") {
        alert(t("conference_submitted"))
      } else {
        alert(t("conference") + " создана успешно!")
      }

      await checkPermissions()
      setFormData({
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
        languages: [],
      })
      setCommittees([{ name: "", topic: "", capacity: 15, priority: 1, countries: [], languages: [] }])
    } catch (error) {
      console.error("[v0] Error creating conference:", error)
      alert("Ошибка при создании конференции: " + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !canCreate) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">{t("loading")}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">{t("create_conference")}</h1>
            <p className="text-muted-foreground">Создайте новую MUN конференцию</p>
          </div>
          <Link href="/">
            <Button variant="outline">
              <Home className="h-5 w-5 mr-2" />
              {t("go_to_home")}
            </Button>
          </Link>
        </div>

        {myConferences.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Мои конференции</CardTitle>
              <CardDescription>{myConferences.length} конференций</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {myConferences.map((conf) => (
                  <div key={conf.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{conf.name_ru}</p>
                      <p className="text-sm text-muted-foreground">
                        {conf.date_ru} • {conf.location}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteConference(conf.id, conf.name_ru)}
                    >
                      {t("delete")}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{t("conference_name")}</CardTitle>
            <CardDescription>Заполните информацию о конференции</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="name">{t("conference_name")} *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Например: ALAMUN 2025"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="date">{t("conference_date")} *</Label>
                  <Input
                    id="date"
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="time">{t("conference_time")} *</Label>
                  <Input
                    id="time"
                    type="time"
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="region">{t("region")} *</Label>
                <Select value={formData.region} onValueChange={(value) => setFormData({ ...formData, region: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("select_city")} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(REGIONS).map(([regionNum, cityNames]) => (
                      <SelectItem key={regionNum} value={regionNum}>
                        {cityNames[language]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Deputy Assignment - only for General Secretary */}
              {userRole === "general_secretary" && myDeputies.length > 0 && (
                <div className="grid gap-2">
                  <Label htmlFor="deputy">
                    {language === "ru" ? "Назначить заместителя" : language === "kk" ? "Орынбасарды тағайындау" : "Assign Deputy"} 
                    <span className="text-sm text-muted-foreground ml-2">({language === "ru" ? "необязательно" : language === "kk" ? "міндетті емес" : "optional"})</span>
                  </Label>
                  <Select value={selectedDeputy} onValueChange={setSelectedDeputy}>
                    <SelectTrigger>
                      <SelectValue placeholder={language === "ru" ? "Выберите заместителя" : language === "kk" ? "Орынбасарды таңдаңыз" : "Select deputy"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">{language === "ru" ? "Без заместителя" : language === "kk" ? "Орынбасарсыз" : "No deputy"}</SelectItem>
                      {myDeputies.map((deputy) => (
                        <SelectItem key={deputy.user_id} value={deputy.user_id}>
                          {deputy.full_name} {deputy.region && `(${REGIONS[deputy.region]?.[language]})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    {language === "ru" ? "Заместитель сможет управлять заявками и комитетами этой конференции" : language === "kk" ? "Орынбасар осы конференцияның өтінімдері мен комитеттерін басқара алады" : "Deputy will be able to manage applications and committees for this conference"}
                  </p>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="location">{t("conference_location")} *</Label>
                <Input
                  id="location"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Например: НИШ ФМН г. Алматы, Актовый зал"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="organizer_contact">{t("organizer_contact")} *</Label>
                <Input
                  id="organizer_contact"
                  required
                  value={formData.organizer_contact}
                  onChange={(e) => setFormData({ ...formData, organizer_contact: e.target.value })}
                  placeholder="Email и телефон организатора"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 grid gap-2">
                  <Label htmlFor="fee">{t("registration_fee")}</Label>
                  <Input
                    id="fee"
                    type="number"
                    step="0.01"
                    value={formData.registration_fee_amount}
                    onChange={(e) => setFormData({ ...formData, registration_fee_amount: e.target.value })}
                    placeholder="5000"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="currency">Валюта</Label>
                  <Select
                    value={formData.registration_fee_currency}
                    onValueChange={(value) => setFormData({ ...formData, registration_fee_currency: value })}
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

              {/* Payment Details */}
              <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                <Label className="text-base font-semibold">{t("payment_details")}</Label>
                <p className="text-sm text-muted-foreground">{t("payment_details_desc")}</p>

                <div className="grid gap-2">
                  <Label htmlFor="payment_bank">{t("payment_bank")}</Label>
                  <Select
                    value={formData.payment_bank}
                    onValueChange={(value) => setFormData({ ...formData, payment_bank: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("select_bank")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Kaspi Bank">Kaspi Bank</SelectItem>
                      <SelectItem value="Halyk Bank">Halyk Bank</SelectItem>
                      <SelectItem value="Jusan Bank">Jusan Bank</SelectItem>
                      <SelectItem value="Forte Bank">Forte Bank</SelectItem>
                      <SelectItem value="Bereke Bank">Bereke Bank</SelectItem>
                      <SelectItem value="Freedom Bank">Freedom Bank</SelectItem>
                      <SelectItem value="Eurasian Bank">Eurasian Bank</SelectItem>
                      <SelectItem value="other">
                        {language === "ru" ? "Другой" : language === "kk" ? "Басқа" : "Other"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="payment_card_number">{t("payment_card_number")}</Label>
                  <Input
                    id="payment_card_number"
                    value={formData.payment_card_number}
                    onChange={(e) => setFormData({ ...formData, payment_card_number: e.target.value })}
                    placeholder="4400 0000 0000 0000"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="payment_card_holder">{t("payment_card_holder")}</Label>
                  <Input
                    id="payment_card_holder"
                    value={formData.payment_card_holder}
                    onChange={(e) => setFormData({ ...formData, payment_card_holder: e.target.value })}
                    placeholder="IVANOV IVAN"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="payment_instructions">{t("payment_instructions")}</Label>
                  <Textarea
                    id="payment_instructions"
                    value={formData.payment_instructions}
                    onChange={(e) => setFormData({ ...formData, payment_instructions: e.target.value })}
                    placeholder={
                      language === "ru"
                        ? "Например: Переведите на Kaspi Gold, в комментарии укажите ФИО и название конференции"
                        : language === "kk"
                          ? "Мысалы: Kaspi Gold-ға аударыңыз, түсініктемеде аты-жөніңіз бен конференция атауын жазыңыз"
                          : "E.g.: Transfer to Kaspi Gold, include your full name and conference name in the comment"
                    }
                    rows={3}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>{t("conference_languages")}</Label>
                <div className="flex gap-4">
                  {["Русский", "Қазақша", "English"].map((lang) => (
                    <label key={lang} className="flex items-center gap-2">
                      <Checkbox
                        checked={formData.languages.includes(lang)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({ ...formData, languages: [...formData.languages, lang] })
                          } else {
                            setFormData({
                              ...formData,
                              languages: formData.languages.filter((l) => l !== lang),
                            })
                          }
                        }}
                      />
                      <span className="text-sm">{lang}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <Label>{t("committees")} *</Label>
                  <Button type="button" onClick={addCommittee} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    {t("add_committee")}
                  </Button>
                </div>
                <div className="space-y-3">
                  {committees.map((committee, index) => (
                    <div key={index} className="flex gap-2 items-start p-3 border rounded-lg">
                      <div className="flex-1 space-y-2">
                        <Input
                          placeholder={t("committee_name")}
                          value={committee.name}
                          onChange={(e) => updateCommitteeField(index, "name", e.target.value)}
                          required
                        />
                        <Input
                          placeholder={t("committee_topic")}
                          value={committee.topic}
                          onChange={(e) => updateCommitteeField(index, "topic", e.target.value)}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">{t("committee_capacity")}</Label>
                            <Input
                              type="number"
                              min="1"
                              max="100"
                              placeholder="15"
                              value={committee.capacity}
                              onChange={(e) =>
                                updateCommitteeField(index, "capacity", Number.parseInt(e.target.value) || 15)
                              }
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">{t("committee_priority")}</Label>
                            <Input
                              type="number"
                              min="1"
                              placeholder="1"
                              value={committee.priority}
                              onChange={(e) =>
                                updateCommitteeField(index, "priority", Number.parseInt(e.target.value) || 1)
                              }
                            />
                          </div>
                        </div>
                        <div className="pt-2 border-t">
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-xs text-muted-foreground">{t("countries_for_committee")}</Label>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => addCountryToCommittee(index)}
                              className="h-6 text-xs"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              {t("add_country")}
                            </Button>
                          </div>
                          {committee.countries.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {committee.countries.map((country, countryIndex) => (
                                <Badge key={countryIndex} variant="secondary" className="text-xs">
                                  {country}
                                  <button
                                    type="button"
                                    onClick={() => removeCountryFromCommittee(index, countryIndex)}
                                    className="ml-1 hover:text-red-600"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="pt-2 border-t">
                          <Label className="text-xs text-muted-foreground">{t("committee_languages")}</Label>
                          <div className="flex gap-3 mt-2">
                            {["Русский", "Қазақша", "English"].map((lang) => (
                              <label key={lang} className="flex items-center gap-1">
                                <Checkbox
                                  checked={committee.languages.includes(lang)}
                                  onCheckedChange={(checked) => {
                                    const updated = [...committees]
                                    if (checked) {
                                      updated[index].languages = [...updated[index].languages, lang]
                                    } else {
                                      updated[index].languages = updated[index].languages.filter((l) => l !== lang)
                                    }
                                    setCommittees(updated)
                                  }}
                                />
                                <span className="text-xs">{lang}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                      {committees.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeCommittee(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">{t("conference_description")}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Что ожидается от конференции, темы для обсуждения..."
                  rows={4}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="conditions">{t("conference_conditions")}</Label>
                <Textarea
                  id="conditions"
                  value={formData.conditions}
                  onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                  placeholder="Условия участия, требования к делегатам..."
                  rows={4}
                />
              </div>

              {userRole !== "founder" && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">{t("awaiting_founder_approval")}</p>
                </div>
              )}

              <div className="flex gap-4">
                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90" disabled={loading}>
                  {loading ? t("creating_account") : t("create")}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push("/")} className="flex-1">
                  {t("cancel")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
