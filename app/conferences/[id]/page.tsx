"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { createBrowserClient } from "@/lib/supabase/client"
import { useLanguage } from "@/contexts/language-context"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Clock, ArrowLeft } from "lucide-react"

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
}

export default function ConferenceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { t, language } = useLanguage()
  const supabase = createBrowserClient()
  const [conference, setConference] = useState<Conference | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    loadConference()
  }, [params.id])

  async function loadConference() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUserId(user?.id || null)

      const { data, error } = await supabase.from("user_conferences").select("*").eq("id", params.id).single()

      if (error) throw error

      setConference(data)
    } catch (error) {
      console.error("[v0] Error loading conference:", error)
    } finally {
      setLoading(false)
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
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">{t("conference_not_found")}</p>
              <Button asChild>
                <Link href="/conferences">{t("view_conferences")}</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  const name = language === "ru" ? conference.name_ru : language === "kk" ? conference.name_kk : conference.name_en
  const date = language === "ru" ? conference.date_ru : language === "kk" ? conference.date_kk : conference.date_en
  const description =
    language === "ru"
      ? conference.description_ru
      : language === "kk"
        ? conference.description_kk
        : conference.description_en
  const conditions =
    language === "ru"
      ? conference.conditions_ru
      : language === "kk"
        ? conference.conditions_kk
        : conference.conditions_en

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Button asChild variant="ghost" className="mb-6">
            <Link href="/conferences">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("view_conferences")}
            </Link>
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">{name}</CardTitle>
              <CardDescription className="space-y-2 text-base">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {date}
                </div>
                {conference.time && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    {conference.time}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  {conference.location}
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {description && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">{t("conference_description")}</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{description}</p>
                </div>
              )}

              {conditions && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">{t("conference_conditions")}</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{conditions}</p>
                </div>
              )}

              {conference.organizer_contact && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">{t("organizer_contact")}</h3>
                  <p className="text-muted-foreground">{conference.organizer_contact}</p>
                </div>
              )}

              <div className="pt-4 border-t">
                {userId ? (
                  <Button asChild className="w-full bg-[#006633] hover:bg-[#004d26]" size="lg">
                    <Link href={`/conferences/${conference.id}/apply`}>{t("apply_to_conference")}</Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild className="w-full" size="lg" variant="outline">
                      <Link href="/auth/login">{t("login_to_apply")}</Link>
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
