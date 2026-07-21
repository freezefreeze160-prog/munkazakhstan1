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
import { ArrowLeft, Upload, FileText, CheckCircle2, CreditCard } from "lucide-react"

interface Conference {
  id: string
  name_ru: string
  name_kk: string
  name_en: string
  registration_fee_amount: number | null
  registration_fee_currency: string | null
  payment_bank: string | null
  payment_card_number: string | null
  payment_card_holder: string | null
  payment_instructions: string | null
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
    school: "",
    grade: "",
    motivation: "",
    primary_choice: "",
    secondary_choice: "",
    third_choice: "",
  })
  const [positionPaper, setPositionPaper] = useState<File | null>(null)
  const [receipt, setReceipt] = useState<File | null>(null)

  useEffect(() => {
    loadConferenceAndUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      const { data: confData, error: confError } = await supabase
        .from("user_conferences")
        .select(
          "id, name_ru, name_kk, name_en, registration_fee_amount, registration_fee_currency, payment_bank, payment_card_number, payment_card_holder, payment_instructions",
        )
        .eq("id", params.id)
        .single()

      if (confError) throw confError
      setConference(confData)

      const { data: committeesData, error: committeesError } = await supabase
        .from("conference_committees")
        .select("*")
        .eq("conference_id", params.id)
        .order("priority", { ascending: true })

      if (committeesError) throw committeesError
      setCommittees(committeesData || [])

      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("user_id", user.id)
        .single()

      const { data: existingApp } = await supabase
        .from("delegate_applications")
        .select("id")
        .eq("conference_id", params.id)
        .eq("user_id", user.id)
        .maybeSingle()

      if (existingApp) {
        setError(t("already_applied"))
      }

      setFormData((prev) => ({
        ...prev,
        full_name: profileData?.full_name || "",
        email: user.email || "",
        phone: profileData?.phone || "",
      }))
    } catch (error) {
      console.error("[v0] Error loading:", error)
      setError(t("load_error_conference"))
    } finally {
      setLoading(false)
    }
  }

  async function uploadFile(file: File, folder: string): Promise<string> {
    const fd = new FormData()
    fd.append("file", file)
    fd.append("folder", folder)
    const res = await fetch("/api/upload-blob", { method: "POST", body: fd })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "Upload failed")
    return data.url as string
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    try {
      if (committees.length > 0) {
        if (!formData.primary_choice) throw new Error(t("select_committee") + " (" + t("primary_choice") + ")")
        if (!formData.secondary_choice) throw new Error(t("select_committee") + " (" + t("secondary_choice") + ")")
        if (!formData.third_choice) throw new Error(t("select_committee") + " (" + t("third_choice") + ")")
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Optional position paper upload
      let positionPaperUrl: string | null = null
      if (positionPaper) {
        positionPaperUrl = await uploadFile(positionPaper, "position-papers")
      }

      const { data: inserted, error: insertError } = await supabase
        .from("delegate_applications")
        .insert({
          conference_id: params.id as string,
          user_id: user.id,
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone || "",
          motivation: formData.motivation,
          grade: formData.grade ? Number.parseInt(formData.grade, 10) : null,
          school_type: formData.school ? "custom" : null,
          custom_school_name: formData.school || null,
          position_paper_url: positionPaperUrl,
          primary_committee_id: formData.primary_choice || null,
          secondary_committee_id: formData.secondary_choice || null,
          third_committee_id: formData.third_choice || null,
          status: "pending",
        })
        .select("id")
        .single()

      if (insertError) throw insertError

      // Optional payment receipt
      if (receipt) {
        const receiptUrl = await uploadFile(receipt, "receipts")
        await supabase.from("payment_receipts").insert({
          conference_id: params.id as string,
          application_id: inserted?.id || null,
          user_id: user.id,
          receipt_url: receiptUrl,
          full_name: formData.full_name,
          amount: conference?.registration_fee_amount ?? null,
          status: "submitted",
        })
      }

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

  const hasPaymentInfo =
    !!conference.registration_fee_amount ||
    !!conference.payment_bank ||
    !!conference.payment_card_number

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
                {/* Personal info */}
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <Label htmlFor="grade">{t("grade")}</Label>
                    <Input
                      id="grade"
                      type="number"
                      min={7}
                      max={12}
                      value={formData.grade}
                      onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                      placeholder="7-12"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="school">
                    {t("school")} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="school"
                    required
                    value={formData.school}
                    onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                    placeholder={t("school_placeholder")}
                  />
                </div>

                {/* Committee choices */}
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

                {/* Motivation */}
                <div className="grid gap-2">
                  <Label htmlFor="motivation">{t("motivation")}</Label>
                  <Textarea
                    id="motivation"
                    value={formData.motivation}
                    onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                    placeholder={t("why_you")}
                    rows={5}
                  />
                </div>

                {/* Position paper */}
                <div className="grid gap-2">
                  <Label>{t("position_paper")}</Label>
                  <input
                    id="pp-file"
                    type="file"
                    accept=".pdf,.doc,.docx,image/*"
                    className="hidden"
                    onChange={(e) => setPositionPaper(e.target.files?.[0] || null)}
                  />
                  <Button asChild type="button" variant="outline" className="justify-start">
                    <label htmlFor="pp-file" className="cursor-pointer">
                      {positionPaper ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                          <span className="truncate">{positionPaper.name}</span>
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4 mr-2" />
                          {t("attach_position_paper")}
                        </>
                      )}
                    </label>
                  </Button>
                </div>

                {/* Payment requisites + receipt */}
                {hasPaymentInfo && (
                  <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-primary" />
                      <Label className="text-base font-semibold">{t("payment_details")}</Label>
                    </div>
                    {conference.registration_fee_amount ? (
                      <p className="text-sm">
                        {t("registration_fee")}:{" "}
                        <span className="font-bold">
                          {conference.registration_fee_amount.toLocaleString()}{" "}
                          {conference.registration_fee_currency || "KZT"}
                        </span>
                      </p>
                    ) : null}
                    {conference.payment_bank && (
                      <p className="text-sm text-muted-foreground">
                        {t("payment_bank")}: <span className="text-foreground">{conference.payment_bank}</span>
                      </p>
                    )}
                    {conference.payment_card_number && (
                      <p className="text-sm text-muted-foreground">
                        {t("payment_card_number")}:{" "}
                        <span className="text-foreground font-mono">{conference.payment_card_number}</span>
                      </p>
                    )}
                    {conference.payment_card_holder && (
                      <p className="text-sm text-muted-foreground">
                        {t("payment_card_holder")}:{" "}
                        <span className="text-foreground">{conference.payment_card_holder}</span>
                      </p>
                    )}
                    {conference.payment_instructions && (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {conference.payment_instructions}
                      </p>
                    )}

                    <div className="grid gap-2 pt-1">
                      <Label>
                        {t("attach_receipt")}{" "}
                        <span className="text-xs text-muted-foreground font-normal">({t("optional")})</span>
                      </Label>
                      <input
                        id="receipt-file"
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => setReceipt(e.target.files?.[0] || null)}
                      />
                      <Button asChild type="button" variant="outline" className="justify-start">
                        <label htmlFor="receipt-file" className="cursor-pointer">
                          {receipt ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                              <span className="truncate">{receipt.name}</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              {t("attach_receipt")}
                            </>
                          )}
                        </label>
                      </Button>
                      <p className="text-xs text-muted-foreground">{t("receipt_note")}</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary/90"
                    disabled={submitting || committees.length === 0 || alreadyApplied}
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
