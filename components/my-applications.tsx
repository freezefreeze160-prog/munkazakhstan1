"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { createBrowserClient } from "@/lib/supabase/client"
import { useLanguage } from "@/contexts/language-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, FileText, Upload, Trash2, Award, CreditCard, CheckCircle2, Clock, XCircle } from "lucide-react"
import { computeScore, levelFromScore, awardLabelKey, type AwardType, type DelegateLevel } from "@/lib/awards"

interface Application {
  id: string
  conference_id: string
  status: string
  created_at: string
  position_paper_url: string | null
  primary_committee_id: string | null
  secondary_committee_id: string | null
  third_committee_id: string | null
  assigned_committee_id: string | null
  assigned_country: string | null
  rejection_reason: string | null
}

interface Conf {
  id: string
  name_ru: string
  name_kk: string
  name_en: string
  registration_fee_amount: number | null
  registration_fee_currency: string | null
}

interface Committee {
  id: string
  name: string
}

interface Receipt {
  id: string
  conference_id: string
  status: string
}

interface AwardRow {
  conference_id: string
  award_type: string
}

const LEVEL_STYLE: Record<DelegateLevel, string> = {
  gold: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
  silver: "bg-slate-400/15 text-slate-600 dark:text-slate-300 border-slate-400/30",
  bronze: "bg-orange-700/10 text-orange-700 dark:text-orange-400 border-orange-700/30",
}
const LEVEL_EMOJI: Record<DelegateLevel, string> = { gold: "🥇", silver: "🥈", bronze: "🥉" }

export function MyApplications({ userId }: { userId: string }) {
  const { t, language } = useLanguage()
  const supabase = createBrowserClient()
  const [apps, setApps] = useState<Application[]>([])
  const [confs, setConfs] = useState<Record<string, Conf>>({})
  const [committees, setCommittees] = useState<Record<string, Committee>>({})
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [awards, setAwards] = useState<AwardRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  async function loadData() {
    try {
      setLoading(true)
      const { data: appData } = await supabase
        .from("delegate_applications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
      const applications = (appData as Application[]) || []
      setApps(applications)

      const confIds = Array.from(new Set(applications.map((a) => a.conference_id)))
      if (confIds.length) {
        const [{ data: confData }, { data: commData }, { data: recData }, { data: awardData }] = await Promise.all([
          supabase
            .from("user_conferences")
            .select("id, name_ru, name_kk, name_en, registration_fee_amount, registration_fee_currency")
            .in("id", confIds),
          supabase.from("conference_committees").select("id, name").in("conference_id", confIds),
          supabase.from("payment_receipts").select("id, conference_id, status").eq("user_id", userId),
          supabase.from("conference_awards").select("conference_id, award_type").eq("user_id", userId),
        ])
        const confMap: Record<string, Conf> = {}
        ;(confData as Conf[] | null)?.forEach((c) => (confMap[c.id] = c))
        setConfs(confMap)
        const commMap: Record<string, Committee> = {}
        ;(commData as Committee[] | null)?.forEach((c) => (commMap[c.id] = c))
        setCommittees(commMap)
        setReceipts((recData as Receipt[]) || [])
        setAwards((awardData as AwardRow[]) || [])
      }
    } catch (err) {
      console.error("Error loading my applications:", err)
    } finally {
      setLoading(false)
    }
  }

  const confName = (id: string) => {
    const c = confs[id]
    if (!c) return ""
    return language === "ru" ? c.name_ru : language === "kk" ? c.name_kk : c.name_en
  }
  const commName = (id: string | null) => (id ? committees[id]?.name || "" : "")

  async function withdraw(appId: string) {
    if (!confirm(t("confirm_withdraw"))) return
    setBusy(appId)
    try {
      const { error } = await supabase.from("delegate_applications").delete().eq("id", appId)
      if (error) throw error
      setApps((prev) => prev.filter((a) => a.id !== appId))
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setBusy(null)
    }
  }

  async function uploadPositionPaper(e: React.ChangeEvent<HTMLInputElement>, app: Application, committeeId: string) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(app.id + committeeId)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("conference_id", app.conference_id)
      fd.append("doc_type", "position_paper")
      fd.append("title", `${commName(committeeId)} — ${file.name}`)
      fd.append("committee_id", committeeId)
      const res = await fetch("/api/upload-document", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")
      alert(t("document_uploaded"))
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setBusy(null)
      e.target.value = ""
    }
  }

  async function uploadReceipt(e: React.ChangeEvent<HTMLInputElement>, app: Application) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(app.id + "receipt")
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("folder", "receipts")
      const res = await fetch("/api/upload-blob", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")
      // Remove any prior receipt for this conference, then insert the new one
      await supabase.from("payment_receipts").delete().eq("user_id", userId).eq("conference_id", app.conference_id)
      const { error } = await supabase.from("payment_receipts").insert({
        conference_id: app.conference_id,
        application_id: app.id,
        user_id: userId,
        receipt_url: data.url,
        amount: confs[app.conference_id]?.registration_fee_amount ?? null,
        status: "submitted",
      })
      if (error) throw error
      alert(t("receipt_uploaded"))
      await loadData()
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setBusy(null)
      e.target.value = ""
    }
  }

  // Achievements: level from approved conferences + awards
  const approvedCount = apps.filter((a) => a.status === "approved").length
  const awardTypes = awards.map((a) => a.award_type as AwardType)
  const level = levelFromScore(computeScore(approvedCount, awardTypes))

  function statusBadge(status: string) {
    if (status === "approved")
      return (
        <Badge className="bg-green-100 text-green-800 border-green-300">
          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
          {t("approved")}
        </Badge>
      )
    if (status === "rejected")
      return (
        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
          <XCircle className="w-3.5 h-3.5 mr-1" />
          {t("rejected")}
        </Badge>
      )
    return (
      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
        <Clock className="w-3.5 h-3.5 mr-1" />
        {t("pending")}
      </Badge>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <CardTitle>{t("my_applications")}</CardTitle>
            <CardDescription>
              {apps.length > 0 ? `${apps.length} ${t("applications")}` : t("no_applications_yet")}
            </CardDescription>
          </div>
          {/* Achievements strip */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-semibold ${LEVEL_STYLE[level]}`}>
              {LEVEL_EMOJI[level]} {t(`level_${level}` as never)}
            </span>
            {awards.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border bg-primary/5 text-primary text-sm font-medium">
                <Award className="w-3.5 h-3.5" />
                {awards.length} {t("awards")}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">{t("loading")}</p>
        ) : apps.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">{t("no_applications_yet")}</p>
            <Button asChild className="bg-primary hover:bg-primary/90">
              <Link href="/conferences">{t("all_conferences")}</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {apps.map((app) => {
              const receipt = receipts.find((r) => r.conference_id === app.conference_id)
              const appAwards = awards.filter((a) => a.conference_id === app.conference_id)
              const choiceCommittees = [
                app.primary_committee_id,
                app.secondary_committee_id,
                app.third_committee_id,
              ].filter(Boolean) as string[]
              const fee = confs[app.conference_id]?.registration_fee_amount
              return (
                <div key={app.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <Link
                        href={`/conferences/${app.conference_id}`}
                        className="font-semibold text-lg hover:text-primary transition-colors"
                      >
                        {confName(app.conference_id)}
                      </Link>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {new Date(app.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {statusBadge(app.status)}
                  </div>

                  {app.status === "rejected" && app.rejection_reason && (
                    <p className="text-sm text-red-500/90 bg-red-500/5 border border-red-500/20 rounded-md px-3 py-2">
                      {t("reject_reason_label")}: {app.rejection_reason}
                    </p>
                  )}

                  {/* Assigned committee / awards */}
                  {app.assigned_committee_id && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">{t("assigned_committee")}:</span>{" "}
                      <span className="font-medium">{commName(app.assigned_committee_id)}</span>
                      {app.assigned_country && <> · {app.assigned_country}</>}
                    </p>
                  )}
                  {appAwards.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {appAwards.map((a, i) => (
                        <Badge key={i} className="bg-yellow-500/15 text-yellow-700 border-yellow-500/30">
                          <Award className="w-3.5 h-3.5 mr-1" />
                          {t(awardLabelKey(a.award_type as AwardType) as never)}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Position papers per chosen committee */}
                  {choiceCommittees.length > 0 && (
                    <div className="pt-2 border-t space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">{t("position_papers")}</p>
                      {choiceCommittees.map((cid) => (
                        <div key={cid} className="flex items-center justify-between gap-2">
                          <span className="text-sm flex items-center gap-2 min-w-0">
                            <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                            <span className="truncate">{commName(cid)}</span>
                          </span>
                          <input
                            id={`pp-${app.id}-${cid}`}
                            type="file"
                            accept=".pdf,.doc,.docx"
                            className="hidden"
                            onChange={(e) => uploadPositionPaper(e, app, cid)}
                          />
                          <Button asChild variant="outline" size="sm" disabled={busy === app.id + cid}>
                            <label htmlFor={`pp-${app.id}-${cid}`} className="cursor-pointer">
                              <Upload className="w-3.5 h-3.5 mr-1" />
                              {busy === app.id + cid ? t("uploading") : t("upload")}
                            </label>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Payment receipt */}
                  {fee ? (
                    <div className="pt-2 border-t flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-sm flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-primary" />
                        {receipt ? (
                          receipt.status === "confirmed" ? (
                            <Badge className="bg-green-100 text-green-800 border-green-300">
                              {t("payment_confirmed")}
                            </Badge>
                          ) : receipt.status === "rejected" ? (
                            <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                              {t("payment_rejected")}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                              {t("payment_submitted")}
                            </Badge>
                          )
                        ) : (
                          <span className="text-muted-foreground">{t("no_receipt_yet")}</span>
                        )}
                      </span>
                      {receipt?.status !== "confirmed" && (
                        <>
                          <input
                            id={`rc-${app.id}`}
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={(e) => uploadReceipt(e, app)}
                          />
                          <Button asChild variant="outline" size="sm" disabled={busy === app.id + "receipt"}>
                            <label htmlFor={`rc-${app.id}`} className="cursor-pointer">
                              <Upload className="w-3.5 h-3.5 mr-1" />
                              {busy === app.id + "receipt"
                                ? t("uploading")
                                : receipt
                                  ? t("replace_receipt")
                                  : t("attach_receipt")}
                            </label>
                          </Button>
                        </>
                      )}
                    </div>
                  ) : null}

                  {/* Withdraw (only while pending) */}
                  {app.status === "pending" && (
                    <div className="pt-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => withdraw(app.id)}
                        disabled={busy === app.id}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        {t("withdraw_application")}
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
