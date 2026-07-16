"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useLanguage } from "@/contexts/language-context"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X, Calendar, MapPin, DollarSign, Globe } from "lucide-react"

interface PendingConference {
  id: string
  name_ru: string
  name_kk: string
  name_en: string
  city: string
  location: string
  time: string
  date_start: string
  date_end: string
  description_ru: string
  description_kk: string
  description_en: string
  registration_fee_amount: number
  registration_fee_currency: string
  languages: string[]
  status: string
  creator_id: string
  created_at: string
  creator?: {
    full_name: string
    role: string
  }
  committees?: Array<{
    name: string
    capacity: number
    priority: number
    countries: string[]
    languages: string[]
  }>
}

export default function ConferenceApprovals() {
  const [conferences, setConferences] = useState<PendingConference[]>([])
  const [loading, setLoading] = useState(true)
  const { t, language } = useLanguage()
  const supabase = createClient()

  useEffect(() => {
    loadPendingConferences()
  }, [])

  async function loadPendingConferences() {
    try {
      const { data: confs } = await supabase
        .from("user_conferences")
        .select(`
          *,
          creator:profiles!user_conferences_creator_id_fkey(full_name, role)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false })

      if (confs) {
        const conferencesWithCommittees = await Promise.all(
          confs.map(async (conf) => {
            const { data: committees } = await supabase
              .from("conference_committees")
              .select("*")
              .eq("conference_id", conf.id)
              .order("priority", { ascending: true })

            return {
              ...conf,
              creator: Array.isArray(conf.creator) ? conf.creator[0] : conf.creator,
              committees: committees || [],
            }
          }),
        )
        setConferences(conferencesWithCommittees)
      }
    } catch (error) {
      console.error("[v0] Error loading conferences:", error)
    } finally {
      setLoading(false)
    }
  }

  async function approveConference(id: string) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Not authenticated")

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single()

      if (profile?.role !== "founder" && profile?.role !== "admin") {
        alert(t("access_denied"))
        return
      }

      const { error } = await supabase
        .from("user_conferences")
        .update({
          status: "published",
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (error) throw error

      alert(t("conference_approved"))
      loadPendingConferences()
    } catch (error) {
      console.error("[v0] Error approving conference:", error)
      alert(t("error_occurred"))
    }
  }

  async function rejectConference(id: string) {
    if (!confirm(t("confirm_reject_conference"))) return

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Not authenticated")

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single()

      if (profile?.role !== "founder" && profile?.role !== "admin") {
        alert(t("access_denied"))
        return
      }

      const { error } = await supabase.from("user_conferences").update({ status: "rejected" }).eq("id", id)

      if (error) throw error

      alert(t("conference_rejected"))
      loadPendingConferences()
    } catch (error) {
      console.error("[v0] Error rejecting conference:", error)
      alert(t("error_occurred"))
    }
  }

  if (loading) {
    return <p className="text-center text-muted-foreground">{t("loading")}</p>
  }

  if (conferences.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">{t("no_pending_conferences")}</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {conferences.map((conf) => {
        const name = language === "ru" ? conf.name_ru : language === "kk" ? conf.name_kk : conf.name_en
        const description =
          language === "ru" ? conf.description_ru : language === "kk" ? conf.description_kk : conf.description_en

        return (
          <Card key={conf.id} className="p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-foreground mb-2">{name}</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="outline">
                      <Calendar className="h-3 w-3 mr-1" />
                      {conf.date_start} - {conf.date_end}
                    </Badge>
                    <Badge variant="outline">
                      <MapPin className="h-3 w-3 mr-1" />
                      {conf.city}, {conf.location}
                    </Badge>
                    {conf.registration_fee_amount && (
                      <Badge variant="outline">
                        <DollarSign className="h-3 w-3 mr-1" />
                        {conf.registration_fee_amount} {conf.registration_fee_currency}
                      </Badge>
                    )}
                  </div>

                  {conf.creator && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {t("created_by")}: <span className="font-medium">{conf.creator.full_name}</span>
                    </p>
                  )}

                  <p className="text-muted-foreground mb-4">{description}</p>

                  {conf.languages && conf.languages.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">{t("conference_languages")}:</p>
                      <div className="flex gap-2">
                        {conf.languages.map((lang) => (
                          <Badge key={lang} variant="secondary">
                            <Globe className="h-3 w-3 mr-1" />
                            {lang}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {conf.committees && conf.committees.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">
                        {t("committees")} ({conf.committees.length}):
                      </p>
                      <div className="space-y-2">
                        {conf.committees.map((committee) => (
                          <div key={committee.name} className="text-sm bg-muted p-3 rounded-lg">
                            <p className="font-medium">{committee.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {t("capacity")}: {committee.capacity} | {t("countries")}:{" "}
                              {committee.countries?.length || 0}
                              {committee.languages && committee.languages.length > 0 && (
                                <>
                                  {" "}
                                  | {t("languages")}: {committee.languages.join(", ")}
                                </>
                              )}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button onClick={() => approveConference(conf.id)} className="flex-1">
                  <Check className="h-4 w-4 mr-2" />
                  {t("approve")}
                </Button>
                <Button onClick={() => rejectConference(conf.id)} variant="destructive" className="flex-1">
                  <X className="h-4 w-4 mr-2" />
                  {t("reject")}
                </Button>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
