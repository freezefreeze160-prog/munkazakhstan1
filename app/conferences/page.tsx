"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createBrowserClient } from "@/lib/supabase/client"
import { useLanguage } from "@/contexts/language-context"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Clock, Info } from "lucide-react"

interface Conference {
  id: string
  name_ru: string
  name_kk: string
  name_en: string
  date_ru: string
  date_kk: string
  date_en: string
  time: string
  location: string
  city: string
  description_ru: string
  description_kk: string
  description_en: string
  conditions_ru: string
  conditions_kk: string
  conditions_en: string
  organizer_contact: string
  creator_id: string
  created_at: string
  status: string // Assuming status is a field in the Conference interface
}

export default function ConferencesPage() {
  const { t, language } = useLanguage()
  const router = useRouter()
  const supabase = createBrowserClient()
  const [conferences, setConferences] = useState<Conference[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    loadConferences()
  }, [])

  async function loadConferences() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUserId(user?.id || null)

      const { data, error } = await supabase
        .from("user_conferences")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false })

      if (error) throw error

      setConferences(data || [])
    } catch (error) {
      console.error("[v0] Error loading conferences:", error)
    } finally {
      setLoading(false)
    }
  }

  function getConferenceName(conf: Conference) {
    return language === "ru" ? conf.name_ru : language === "kk" ? conf.name_kk : conf.name_en
  }

  function getConferenceDate(conf: Conference) {
    return language === "ru" ? conf.date_ru : language === "kk" ? conf.date_kk : conf.date_en
  }

  function getConferenceDescription(conf: Conference) {
    return language === "ru" ? conf.description_ru : language === "kk" ? conf.description_kk : conf.description_en
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">{t("all_conferences")}</h1>
            <p className="text-muted-foreground">{t("available_conferences")}</p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t("loading")}</p>
            </div>
          ) : conferences.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">{t("no_conferences")}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {conferences.map((conf) => (
                <Card key={conf.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-xl">{getConferenceName(conf)}</CardTitle>
                    <CardDescription className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4" />
                        {getConferenceDate(conf)}
                      </div>
                      {conf.time && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4" />
                          {conf.time}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4" />
                        {conf.location}
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {getConferenceDescription(conf) && (
                      <p className="text-sm text-muted-foreground line-clamp-3">{getConferenceDescription(conf)}</p>
                    )}
                    <div className="flex gap-2">
                      <Button asChild className="flex-1 bg-[#006633] hover:bg-[#004d26]" disabled={!userId}>
                        <Link href={`/conferences/${conf.id}/apply`}>{t("apply_to_conference")}</Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link href={`/conferences/${conf.id}`}>
                          <Info className="w-4 h-4 mr-2" />
                          {t("learn_more")}
                        </Link>
                      </Button>
                    </div>
                    {!userId && <p className="text-xs text-muted-foreground text-center">{t("login")} to apply</p>}
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
