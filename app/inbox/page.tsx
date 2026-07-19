"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useLanguage } from "@/contexts/language-context"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Inbox, Calendar, Mail, Phone, FileText, CheckCircle, XCircle, Users, Shuffle, Home, UserCheck, CreditCard, ExternalLink, Clock, Download, Award } from "lucide-react"
import Link from "next/link"
import { AWARD_TYPES, awardLabelKey, type AwardType } from "@/lib/awards"
import { buildStatusEmail } from "@/lib/email-templates"

interface DelegateApplication {
  id: string
  conference_id: string
  user_id: string
  full_name: string
  email: string
  phone: string
  motivation: string
  status: string
  created_at: string
  assigned_committee_id: string | null
  assigned_country: string | null
  primary_committee_id: string | null
  secondary_committee_id: string | null
  third_committee_id: string | null
}

interface EligibleUser {
  user_id: string
  full_name: string
  role: string
}

interface Committee {
  id: string
  name: string
  topic: string | null
  capacity: number
  priority: number
  countries: string[]
}

interface PaymentReceipt {
  id: string
  conference_id: string
  user_id: string
  receipt_url: string
  full_name: string | null
  status: "submitted" | "confirmed" | "rejected"
  created_at: string
}

interface ConferenceAward {
  id: string
  user_id: string
  award_type: string
}

interface ConferenceWithApplications {
  id: string
  name_ru: string
  name_kk: string
  name_en: string
  date_ru: string
  date_kk: string
  date_en: string
  applications: DelegateApplication[]
  committees: Committee[]
  receipts: PaymentReceipt[]
  awards: ConferenceAward[]
  status: string
  location: string
  registration_fee_amount: number | null
  registration_fee_currency: string | null
  creator_id: string
  assigned_deputy_id: string | null
}

export default function InboxPage() {
  const { t, language } = useLanguage()
  const router = useRouter()
  const supabase = createClient()
  const [conferences, setConferences] = useState<ConferenceWithApplications[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [eligibleUsers, setEligibleUsers] = useState<EligibleUser[]>([])

  useEffect(() => {
    loadApplications()
    loadEligibleUsers()
  }, [])

  async function loadEligibleUsers() {
    const { data } = await supabase
      .from("profiles")
      .select("user_id, full_name, role")
      .in("role", ["founder", "admin", "general_secretary", "deputy"])
      .order("full_name", { ascending: true })
    if (data) setEligibleUsers(data)
  }

  async function assignDeputy(conferenceId: string, deputyUserId: string) {
    try {
      const { error } = await supabase
        .from("user_conferences")
        .update({ assigned_deputy_id: deputyUserId || null })
        .eq("id", conferenceId)
      if (error) throw error
      alert(t("deputy_assigned"))
      await loadApplications()
    } catch (error) {
      console.error("[v0] Error assigning deputy:", error)
      alert("Error: " + (error as Error).message)
    }
  }

  async function loadApplications() {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) {
        console.log("[v0] Auth error in inbox:", authError)
        setError("auth_error")
        setLoading(false)
        return
      }

      if (!user) {
        setError("not_logged_in")
        setLoading(false)
        return
      }

      setUserId(user.id)

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single()

      if (profileError) {
        console.log("[v0] Profile error in inbox:", profileError)
        setError("profile_not_found")
        setLoading(false)
        return
      }

      if (!profile || !["general_secretary", "founder", "admin", "deputy"].includes(profile.role)) {
        setError("access_denied")
        setLoading(false)
        return
      }

      const effectiveRole = profile.role
      setUserRole(effectiveRole)

      let conferencesData: any[] = []

      if (effectiveRole === "founder") {
        // Founder sees all conferences
        const { data, error: confError } = await supabase.from("user_conferences").select("*").order("created_at", { ascending: false })
        if (confError) console.log("[v0] Conferences load error:", confError)
        conferencesData = data || []
      } else if (effectiveRole === "deputy") {
        // Deputy sees only conferences they are assigned to
        const { data } = await supabase
          .from("user_conferences")
          .select("*")
          .eq("assigned_deputy_id", user.id)
          .order("created_at", { ascending: false })
        conferencesData = data || []
      } else {
        // General secretary and admin see only their own conferences
        const { data } = await supabase
          .from("user_conferences")
          .select("*")
          .eq("creator_id", user.id)
          .order("created_at", { ascending: false })
        conferencesData = data || []
      }

      if (conferencesData.length > 0) {
        const conferencesWithApps = await Promise.all(
          conferencesData.map(async (conf) => {
            const { data: committeesData } = await supabase
              .from("conference_committees")
              .select("*")
              .eq("conference_id", conf.id)
              .order("priority", { ascending: true })

            const { data: apps, error: appsError } = await supabase
              .from("delegate_applications")
              .select("*")
              .eq("conference_id", conf.id)
              .order("created_at", { ascending: false })

            if (appsError) console.log("[v0] Apps load error:", appsError)

            const { data: receipts } = await supabase
              .from("payment_receipts")
              .select("*")
              .eq("conference_id", conf.id)
              .order("created_at", { ascending: false })

            const { data: awards } = await supabase
              .from("conference_awards")
              .select("id, user_id, award_type")
              .eq("conference_id", conf.id)

            return {
              ...conf,
              applications: apps || [],
              committees: committeesData || [],
              receipts: receipts || [],
              awards: awards || [],
            }
          }),
        )
        setConferences(conferencesWithApps)
      }
    } catch (error) {
      console.error("[v0] Error loading applications:", error)
      setError("unknown_error")
    } finally {
      setLoading(false)
    }
  }

  async function runAutoAssignment(conferenceId: string) {
    try {
      const conference = conferences.find((c) => c.id === conferenceId)
      if (!conference) return

      const approvedApps = conference.applications.filter((app) => app.status === "approved")
      // Only auto-assign delegates who don't have a committee yet
      const unassignedApps = approvedApps.filter((app) => !app.assigned_committee_id)
      const sortedCommittees = [...conference.committees].sort((a, b) => a.priority - b.priority)

      const assignments: { [appId: string]: string } = {}
      const committeeCount: { [committeeId: string]: number } = {}
      const usedCountries: { [committeeId: string]: Set<string> } = {}

      // Pre-seed counts with delegates already assigned, so capacity is respected
      sortedCommittees.forEach((c) => {
        committeeCount[c.id] = approvedApps.filter((app) => app.assigned_committee_id === c.id).length
        usedCountries[c.id] = new Set(
          approvedApps
            .filter((app) => app.assigned_committee_id === c.id && app.assigned_country)
            .map((app) => app.assigned_country!)
        )
      })

      // First pass: primary choice
      for (const app of unassignedApps) {
        const pid = app.primary_committee_id
        if (pid && committeeCount[pid] !== undefined) {
          const committee = sortedCommittees.find((c) => c.id === pid)
          if (committee && committeeCount[pid] < committee.capacity) {
            assignments[app.id] = pid
            committeeCount[pid]++
          }
        }
      }

      // Second pass: secondary choice
      for (const app of unassignedApps) {
        const sid = app.secondary_committee_id
        if (!assignments[app.id] && sid && committeeCount[sid] !== undefined) {
          const committee = sortedCommittees.find((c) => c.id === sid)
          if (committee && committeeCount[sid] < committee.capacity) {
            assignments[app.id] = sid
            committeeCount[sid]++
          }
        }
      }

      // Third pass: tertiary choice
      for (const app of unassignedApps) {
        const tid = app.third_committee_id
        if (!assignments[app.id] && tid && committeeCount[tid] !== undefined) {
          const committee = sortedCommittees.find((c) => c.id === tid)
          if (committee && committeeCount[tid] < committee.capacity) {
            assignments[app.id] = tid
            committeeCount[tid]++
          }
        }
      }

      // Assign countries
      const countryAssignments: { [appId: string]: string } = {}

      for (const [appId, committeeId] of Object.entries(assignments)) {
        const app = unassignedApps.find((a) => a.id === appId)
        if (!app) continue

        if (app.assigned_country) {
          countryAssignments[appId] = app.assigned_country
          usedCountries[committeeId].add(app.assigned_country)
          continue
        }

        const committee = sortedCommittees.find((c) => c.id === committeeId)
        if (!committee || !committee.countries || committee.countries.length === 0) continue

        const availableCountries = committee.countries.filter((country) => !usedCountries[committeeId].has(country))

        if (availableCountries.length > 0) {
          const randomCountry = availableCountries[Math.floor(Math.random() * availableCountries.length)]
          countryAssignments[appId] = randomCountry
          usedCountries[committeeId].add(randomCountry)
        }
      }

      // Update database directly
      const updates = Object.entries(assignments).map(([appId, committeeId]) => {
        return supabase
          .from("delegate_applications")
          .update({
            assigned_committee_id: committeeId,
            assigned_country: countryAssignments[appId] || null,
          })
          .eq("id", appId)
      })

      await Promise.all(updates)

      alert(t("assignment_complete"))
      await loadApplications()
    } catch (error) {
      console.error("[v0] Error in auto-assignment:", error)
      alert("Error during assignment: " + (error as Error).message)
    }
  }

  async function updateApplicationStatus(
    app: DelegateApplication,
    conf: ConferenceWithApplications,
    status: string,
  ) {
    try {
      const { error } = await supabase
        .from("delegate_applications")
        .update({ status })
        .eq("id", app.id)

      if (error) throw error

      // Notify the delegate (in-app + best-effort email) on approve/reject
      if ((status === "approved" || status === "rejected") && app.user_id) {
        const confName = getConferenceName(conf)
        const title = status === "approved" ? t("notif_approved_title") : t("notif_rejected_title")
        const emailBody = status === "approved" ? t("email_approved_body") : t("email_rejected_body")

        // In-app notification (works immediately, no external service)
        await supabase.from("notifications").insert({
          user_id: app.user_id,
          type: "application_status",
          title,
          body: confName,
          data: { conference_id: conf.id, status },
        })

        // Email (silently skipped if email isn't configured yet) — branded template
        if (app.email) {
          const committeeName =
            status === "approved"
              ? conf.committees?.find((c) => c.id === app.assigned_committee_id)?.name || null
              : null
          const html = buildStatusEmail({
            delegateName: app.full_name,
            conferenceName: confName,
            status: status as "approved" | "rejected",
            heading: title,
            message: emailBody,
            committee: committeeName,
            country: status === "approved" ? app.assigned_country : null,
            committeeLabel: t("email_committee_label"),
            countryLabel: t("email_country_label"),
            footerNote: t("email_footer_tagline"),
            ctaLabel: status === "approved" ? t("email_view_conference") : undefined,
            ctaUrl:
              status === "approved"
                ? `${window.location.origin}/conferences/${conf.id}`
                : undefined,
          })
          fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: app.email,
              subject: `${title} — ${confName}`,
              html,
            }),
          }).catch(() => {})
        }
      }

      alert(t("status_updated"))
      await loadApplications()
    } catch (error) {
      console.error("[v0] Error updating application status:", error)
      alert("Error: " + (error as Error).message)
    }
  }

  async function assignAward(conferenceId: string, delegateUserId: string, awardType: string) {
    try {
      if (!awardType) {
        // Remove any existing award for this delegate
        const { error } = await supabase
          .from("conference_awards")
          .delete()
          .eq("conference_id", conferenceId)
          .eq("user_id", delegateUserId)
        if (error) throw error
      } else {
        const { error } = await supabase.from("conference_awards").upsert(
          {
            conference_id: conferenceId,
            user_id: delegateUserId,
            award_type: awardType,
            created_by: userId,
          },
          { onConflict: "conference_id,user_id" },
        )
        if (error) throw error

        // Notify the delegate about their award
        const conf = conferences.find((c) => c.id === conferenceId)
        await supabase.from("notifications").insert({
          user_id: delegateUserId,
          type: "award",
          title: t("notif_award_title"),
          body: `${t(awardLabelKey(awardType as AwardType) as never)}${conf ? " — " + getConferenceName(conf) : ""}`,
          data: { conference_id: conferenceId, award_type: awardType },
        })
      }
      alert(t("award_assigned"))
      await loadApplications()
    } catch (error) {
      console.error("[v0] Error assigning award:", error)
      alert("Error: " + (error as Error).message)
    }
  }

  async function updatePaymentStatus(receiptId: string, status: "confirmed" | "rejected") {
    try {
      const { error } = await supabase
        .from("payment_receipts")
        .update({
          status,
          confirmed_by: userId,
          confirmed_at: new Date().toISOString(),
        })
        .eq("id", receiptId)

      if (error) throw error
      alert(status === "confirmed" ? t("payment_confirmed_toast") : t("payment_rejected_toast"))
      await loadApplications()
    } catch (error) {
      console.error("[v0] Error updating payment status:", error)
      alert("Error: " + (error as Error).message)
    }
  }

  async function approveConference(conferenceId: string) {
    try {
      const { error } = await supabase
        .from("user_conferences")
        .update({
          status: "published",
          approved_by: userId,
          approved_at: new Date().toISOString(),
        })
        .eq("id", conferenceId)

      if (error) throw error

      alert(t("conference_approved"))
      await loadApplications()
    } catch (error) {
      console.error("[v0] Error approving conference:", error)
      alert("Error: " + (error as Error).message)
    }
  }

  async function rejectConference(conferenceId: string) {
    if (!confirm(t("confirm_reject_conference"))) return

    try {
      const { error } = await supabase
        .from("user_conferences")
        .update({ status: "rejected" })
        .eq("id", conferenceId)

      if (error) throw error

      alert(t("conference_rejected"))
      await loadApplications()
    } catch (error) {
      console.error("[v0] Error rejecting conference:", error)
      alert("Error: " + (error as Error).message)
    }
  }

  function exportApplicationsCsv(conf: ConferenceWithApplications) {
    if (conf.applications.length === 0) {
      alert(t("export_no_data"))
      return
    }
    const committeeName = (id: string | null) =>
      conf.committees.find((c) => c.id === id)?.name || ""
    const headers = [
      t("full_name"),
      t("email"),
      t("phone"),
      t("status"),
      t("primary_choice"),
      t("secondary_choice"),
      t("tertiary_choice"),
      t("assigned_committee"),
      t("assigned_country"),
      t("motivation"),
      t("submitted_on"),
    ]
    const escape = (val: unknown) => {
      const s = String(val ?? "")
      return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const rows = conf.applications.map((app) =>
      [
        app.full_name,
        app.email,
        app.phone,
        t(app.status as never) || app.status,
        committeeName(app.primary_committee_id),
        committeeName(app.secondary_committee_id),
        committeeName(app.third_committee_id),
        committeeName(app.assigned_committee_id),
        app.assigned_country || "",
        app.motivation || "",
        app.created_at ? new Date(app.created_at).toLocaleDateString() : "",
      ]
        .map(escape)
        .join(","),
    )
    const csv = "﻿" + [headers.map(escape).join(","), ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    const safeName = getConferenceName(conf).replace(/[^a-zA-Z0-9а-яА-Я_-]+/g, "_")
    link.download = `${safeName || "applications"}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  function getConferenceName(conf: ConferenceWithApplications) {
    return language === "ru" ? conf.name_ru : language === "kk" ? conf.name_kk : conf.name_en
  }

  function getConferenceDate(conf: ConferenceWithApplications) {
    return language === "ru" ? conf.date_ru : language === "kk" ? conf.date_kk : conf.date_en
  }

  const totalApplications = conferences.reduce((sum, conf) => sum + conf.applications.length, 0)
  const pendingApplications = conferences.reduce(
    (sum, conf) => sum + conf.applications.filter((app) => app.status === "pending").length,
    0,
  )

  function getCommitteeStats(conference: ConferenceWithApplications) {
    const stats: { [committeeId: string]: { assigned: number; capacity: number; name: string } } = {}

    conference.committees.forEach((c) => {
      stats[c.id] = {
        assigned: conference.applications.filter((app) => app.assigned_committee_id === c.id).length,
        capacity: c.capacity,
        name: c.name,
      }
    })

    return stats
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-12">
          <div className="container mx-auto px-4">
            <p className="text-center">{t("loading")}</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <p className="text-destructive font-medium">
              {error === "not_logged_in" && t("please_login")}
              {error === "access_denied" && t("access_denied")}
              {error === "profile_not_found" && t("profile_not_found")}
              {error === "auth_error" && t("auth_error")}
              {error === "unknown_error" && t("error_occurred")}
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild>
                <Link href="/auth/login">{t("login")}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/">{t("go_to_home")}</Link>
              </Button>
            </div>
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
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Pending Conference Requests for Founder */}
          {userRole === "founder" && conferences.filter((c) => c.status === "pending" && c.status != null).length > 0 && (
            <Card className="mb-6 border-yellow-500/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {t("conference_requests")}
                </CardTitle>
                <CardDescription>{t("pending_conference_requests")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {conferences
                    .filter((c) => c.status === "pending" && c.status != null)
                    .map((conf) => (
                      <div key={conf.id} className="border rounded-lg p-4 space-y-3">
                        <div>
                          <p className="font-semibold text-lg">{getConferenceName(conf)}</p>
                          <p className="text-sm text-muted-foreground">
                            {getConferenceDate(conf)} • {conf.location}
                          </p>
                          {conf.registration_fee_amount && (
                            <p className="text-sm font-medium text-green-600 mt-1">
                              {t("registration_fee")}: {conf.registration_fee_amount} {conf.registration_fee_currency}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground mt-1">
                            {t("committees")}: {conf.committees.length}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => approveConference(conf.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {t("approve_conference")}
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => rejectConference(conf.id)}>
                            <XCircle className="h-4 w-4 mr-1" />
                            {t("reject_conference")}
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <Inbox className="w-8 h-8" />
                {t("applications_inbox")}
              </h1>
              <p className="text-muted-foreground">
                {totalApplications} {t("applications")} • {pendingApplications} {t("pending")}
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                {t("go_to_home")}
              </Link>
            </Button>
          </div>

          {conferences.filter((c) => c.status !== "rejected").length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Inbox className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">{t("no_applications_inbox")}</p>
                <Button asChild>
                  <Link href="/create-conference">{t("create_conference")}</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {conferences
                .filter((c) => c.status !== "rejected")
                .map((conf) => (
                  <Card key={conf.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <CardTitle className="text-2xl">{getConferenceName(conf)}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Calendar className="w-4 h-4" />
                            {getConferenceDate(conf)}
                            <span className="ml-2">
                              • {conf.applications.length} {t("applications")}
                            </span>
                          </CardDescription>
                        </div>
                        {conf.applications.length > 0 && (
                          <Button size="sm" variant="outline" onClick={() => exportApplicationsCsv(conf)}>
                            <Download className="w-4 h-4 mr-2" />
                            {t("export_csv")}
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {conf.committees.length > 0 && (
                        <div className="mb-6 p-4 bg-muted rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              {t("committee_stats")}
                            </h4>
                            <Button size="sm" onClick={() => runAutoAssignment(conf.id)} variant="outline">
                              <Shuffle className="w-4 h-4 mr-2" />
                              {t("run_auto_assign")}
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {Object.entries(getCommitteeStats(conf)).map(([committeeId, stats]) => (
                              <div key={committeeId} className="text-sm">
                                <p className="font-medium">{stats.name}</p>
                                <p className="text-muted-foreground">
                                  {stats.assigned}/{stats.capacity} {t("filled")}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Deputy Assignment */}
                      {eligibleUsers.length > 0 && (
                        <div className="mb-6 p-4 border rounded-lg">
                          <h4 className="font-semibold flex items-center gap-2 mb-3">
                            <UserCheck className="w-4 h-4" />
                            {t("assign_deputy")}
                          </h4>
                          <div className="flex gap-2 items-center">
                            <select
                              className="flex-1 text-sm border rounded-md px-3 py-2 bg-background"
                              defaultValue={conf.assigned_deputy_id || ""}
                              onChange={(e) => assignDeputy(conf.id, e.target.value)}
                            >
                              <option value="">{t("no_deputy_assigned")}</option>
                              {eligibleUsers.map((u) => (
                                <option key={u.user_id} value={u.user_id}>
                                  {u.full_name} ({t(u.role) || u.role})
                                </option>
                              ))}
                            </select>
                          </div>
                          {conf.assigned_deputy_id && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {t("current_deputy")}: {eligibleUsers.find((u) => u.user_id === conf.assigned_deputy_id)?.full_name || conf.assigned_deputy_id}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Payment receipts */}
                      {conf.receipts && conf.receipts.length > 0 && (
                        <div className="mb-6 p-4 border rounded-lg">
                          <h4 className="font-semibold flex items-center gap-2 mb-3">
                            <CreditCard className="w-4 h-4" />
                            {t("payment_receipts_inbox")}
                            <span className="text-sm font-normal text-muted-foreground">
                              ({conf.receipts.length})
                            </span>
                          </h4>
                          <div className="space-y-2">
                            {conf.receipts.map((receipt) => (
                              <div
                                key={receipt.id}
                                className="flex items-center gap-3 p-3 rounded-lg border bg-background flex-wrap"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {receipt.full_name || t("receipt_from")}
                                  </p>
                                  <a
                                    href={receipt.receipt_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    {t("view_receipt")}
                                  </a>
                                </div>
                                {receipt.status === "confirmed" ? (
                                  <Badge className="bg-green-100 text-green-800 border-green-300">
                                    <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                    {t("payment_confirmed")}
                                  </Badge>
                                ) : receipt.status === "rejected" ? (
                                  <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                                    <XCircle className="w-3.5 h-3.5 mr-1" />
                                    {t("payment_rejected")}
                                  </Badge>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                      <Clock className="w-3.5 h-3.5 mr-1" />
                                      {t("payment_submitted")}
                                    </Badge>
                                    <Button
                                      size="sm"
                                      onClick={() => updatePaymentStatus(receipt.id, "confirmed")}
                                      className="bg-green-600 hover:bg-green-700 h-8"
                                    >
                                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                      {t("confirm_payment")}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => updatePaymentStatus(receipt.id, "rejected")}
                                      className="h-8"
                                    >
                                      <XCircle className="h-3.5 w-3.5 mr-1" />
                                      {t("reject_payment")}
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {conf.applications.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">{t("no_applications")}</p>
                      ) : (
                        <div className="space-y-4">
                          {conf.applications.map((app) => (
                            <Card key={app.id} className="border-2">
                              <CardContent className="p-6">
                                <div className="space-y-4">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <h4 className="text-lg font-semibold">{app.full_name}</h4>
                                      <div className="space-y-1 mt-2">
                                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                                          <Mail className="w-4 h-4" />
                                          {app.email}
                                        </p>
                                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                                          <Phone className="w-4 h-4" />
                                          {app.phone}
                                        </p>
                                      </div>
                                    </div>
                                    <Badge
                                      variant={
                                        app.status === "approved"
                                          ? "default"
                                          : app.status === "rejected"
                                            ? "destructive"
                                            : "secondary"
                                      }
                                    >
                                      {t(app.status)}
                                    </Badge>
                                  </div>

                                  {/* Committee Choices */}
                                  <div className="grid grid-cols-3 gap-2 text-sm">
                                    <div>
                                      <p className="font-medium text-xs text-muted-foreground">{t("primary_choice")}</p>
                                      <p>{conf.committees.find((c) => c.id === app.primary_committee_id)?.name || "-"}</p>
                                    </div>
                                    <div>
                                      <p className="font-medium text-xs text-muted-foreground">
                                        {t("secondary_choice")}
                                      </p>
                                      <p>{conf.committees.find((c) => c.id === app.secondary_committee_id)?.name || "-"}</p>
                                    </div>
                                    <div>
                                      <p className="font-medium text-xs text-muted-foreground">
                                        {t("tertiary_choice")}
                                      </p>
                                      <p>{conf.committees.find((c) => c.id === app.third_committee_id)?.name || "-"}</p>
                                    </div>
                                  </div>

                                  {/* Assignment Info */}
                                  {app.assigned_committee_id && (
                                    <div className="p-3 bg-green-500/10 rounded-lg">
                                      <p className="text-sm">
                                        <span className="font-medium">{t("assigned_committee")}:</span>{" "}
                                        {conf.committees.find((c) => c.id === app.assigned_committee_id)?.name}
                                      </p>
                                      {app.assigned_country && (
                                        <p className="text-sm">
                                          <span className="font-medium">{t("assigned_country")}:</span>{" "}
                                          {app.assigned_country}
                                        </p>
                                      )}
                                    </div>
                                  )}

                                  {/* Motivation */}
                                  {app.motivation && (
                                    <div>
                                      <p className="font-medium text-sm">{t("motivation")}:</p>
                                      <p className="text-sm text-muted-foreground">{app.motivation}</p>
                                    </div>
                                  )}

                                  {/* Actions */}
                                  <div className="flex gap-2 items-center flex-wrap">
                                    {app.status === "pending" && (
                                      <>
                                        <Button
                                          size="sm"
                                          onClick={() => updateApplicationStatus(app, conf, "approved")}
                                          className="bg-green-600 hover:bg-green-700"
                                        >
                                          <CheckCircle className="h-4 w-4 mr-1" />
                                          {t("approve")}
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          onClick={() => updateApplicationStatus(app, conf, "rejected")}
                                        >
                                          <XCircle className="h-4 w-4 mr-1" />
                                          {t("reject")}
                                        </Button>
                                      </>
                                    )}

                                    {/* Award selector (for approved delegates) */}
                                    {app.status === "approved" && (
                                      <div className="flex items-center gap-2">
                                        <Award className="w-4 h-4 text-yellow-600" />
                                        <select
                                          className="text-sm border rounded-md px-2 py-1.5 bg-background"
                                          value={
                                            conf.awards.find((a) => a.user_id === app.user_id)?.award_type || ""
                                          }
                                          onChange={(e) => assignAward(conf.id, app.user_id, e.target.value)}
                                        >
                                          <option value="">{t("no_award")}</option>
                                          {AWARD_TYPES.map((type: AwardType) => (
                                            <option key={type} value={type}>
                                              {t(awardLabelKey(type) as never)}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
