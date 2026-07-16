"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useLanguage } from "@/contexts/language-context"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AnimatedHero } from "@/components/ui/animated-hero"
import { ContainerScroll } from "@/components/ui/container-scroll-animation"
import ShaderBackground from "@/components/ui/shader-background"
import { Calendar, Users, Award, ArrowRight, Clock } from "lucide-react"

interface Conference {
  id: string
  name_ru: string
  name_kk: string
  name_en: string
  date_ru: string
  date_kk: string
  date_en: string
  location: string
  city: string
  created_at: string
  status: string // Assuming status field exists in Conference interface
}

export default function HomePage() {
  // MUN Kazakhstan Home Page
  const { t, language } = useLanguage()
  const [upcomingConferences, setUpcomingConferences] = useState<Conference[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUpcomingConferences()
  }, [])

  async function loadUpcomingConferences() {
    try {
      const client = createBrowserClient()

      let retries = 0
      let data = null
      let error = null

      while (retries < 2) {
        try {
          const response = await client
            .from("user_conferences")
            .select("*")
            .eq("status", "published")
            .order("created_at", { ascending: false })
            .limit(4)

          data = response.data
          error = response.error

          if (!error) break // Success, exit retry loop
        } catch (fetchError) {
          retries++
          if (retries >= 2) throw fetchError
          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, 500))
        }
      }

      if (error) {
        console.error("Supabase error:", error)
        // Fallback: show empty state instead of crashing
        setUpcomingConferences([])
        setLoading(false)
        return
      }

      setUpcomingConferences((data || []).slice(0, 4))
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

  function getDaysUntilConference(conf: Conference): number | null {
    const dateMatch = conf.date_ru?.match(/(\d+)[-–](\d+)\s+(\w+)\s+(\d{4})/)
    if (dateMatch) {
      const [, startDay, , month, year] = dateMatch
      const monthMap: { [key: string]: number } = {
        января: 0,
        февраля: 1,
        марта: 2,
        апреля: 3,
        мая: 4,
        июня: 5,
        июля: 6,
        августа: 7,
        сентября: 8,
        октября: 9,
        ноября: 10,
        декабря: 11,
      }
      const monthNum = monthMap[month.toLowerCase()]
      if (monthNum !== undefined) {
        const confDate = new Date(Number.parseInt(year), monthNum, Number.parseInt(startDay))
        const now = new Date()
        const diffTime = confDate.getTime() - now.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays > 0 ? diffDays : null
      }
    }
    return null
  }

  const heroTitles =
    language === "ru"
      ? ["лидеров", "дипломатов", "ораторов", "новаторов", "переговорщиков"]
      : language === "kk"
        ? ["тәрбиелейміз", "дамытамыз", "шабыттандырамыз"]
        : ["leaders", "diplomats", "speakers", "innovators", "negotiators"]

  const heroStatic =
    language === "kk"
      ? "Көшбасшыларды"
      : t("welcome_short") || "Воспитываем"

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero with shader background */}
        <section className="relative overflow-hidden min-h-[88vh] flex items-center">
          <ShaderBackground />
          {/* dark overlay for readability */}
          <div className="absolute inset-0 bg-background/60" />
          <div className="relative z-10 w-full">
            <AnimatedHero
              staticText={heroStatic}
              titles={heroTitles}
              description={t("hero_desc")}
              primaryLabel={t("apply_now")}
              primaryHref="/register"
              secondaryLabel={t("learn_more")}
              secondaryHref="/about"
            />
          </div>
        </section>

        {/* Scroll-animation: real available conferences */}
        <section className="bg-background overflow-hidden">
          <ContainerScroll
            titleComponent={
              <div className="flex flex-col items-center gap-4">
                <span className="inline-block bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-semibold">
                  {t("conference_2025")}
                </span>
                <h2 className="text-3xl md:text-5xl font-bold text-foreground text-balance text-center">
                  {t("upcoming")}
                </h2>
                <p className="text-muted-foreground text-lg max-w-xl text-center">
                  {t("upcoming_desc")}
                </p>
              </div>
            }
          >
            <div className="h-full w-full p-6 bg-muted/30 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">{t("loading")}</p>
                </div>
              ) : upcomingConferences.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <p className="text-muted-foreground text-center">{t("no_conferences")}</p>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/conferences">{t("view_conferences")}</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4 content-start">
                  {upcomingConferences.map((conf) => {
                    const daysLeft = getDaysUntilConference(conf)
                    return (
                      <Link key={conf.id} href={`/conferences/${conf.id}`} className="group">
                        <div className="bg-background rounded-xl p-5 flex flex-col gap-3 shadow-sm border border-border/60 hover:border-primary/50 hover:shadow-md transition-all h-full">
                          <div className="flex items-start justify-between gap-2">
                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Calendar className="w-4 h-4 text-primary" />
                            </div>
                            {daysLeft !== null && daysLeft <= 14 && (
                              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {daysLeft}d
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-foreground text-sm leading-snug">{getConferenceName(conf)}</p>
                            <p className="text-xs text-muted-foreground mt-1">{getConferenceDate(conf)}</p>
                            {conf.location && (
                              <p className="text-xs text-muted-foreground mt-0.5">{conf.location}</p>
                            )}
                          </div>
                          <span className="text-xs text-primary font-medium group-hover:underline mt-auto">
                            {t("learn_more")} →
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </ContainerScroll>
        </section>

        {/* Features */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <Card className="border-2 hover:border-primary transition-colors">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-foreground">{t("networking")}</h3>
                  <p className="text-muted-foreground leading-relaxed">{t("networking_desc")}</p>
                </CardContent>
              </Card>
              <Card className="border-2 hover:border-primary transition-colors">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Award className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-foreground">{t("skills")}</h3>
                  <p className="text-muted-foreground leading-relaxed">{t("skills_desc")}</p>
                </CardContent>
              </Card>
              <Card className="border-2 hover:border-primary transition-colors">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-foreground">{t("experience")}</h3>
                  <p className="text-muted-foreground leading-relaxed">{t("experience_desc")}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Upcoming conferences */}
        <section className="py-16 md:py-24 bg-accent/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h3 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">{t("upcoming")}</h3>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t("upcoming_desc")}</p>
            </div>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">{t("loading")}</p>
              </div>
            ) : upcomingConferences.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">{t("no_conferences")}</p>
                <Button asChild variant="outline" size="lg">
                  <Link href="/conferences">{t("view_conferences")}</Link>
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {upcomingConferences.map((conf) => {
                  const daysLeft = getDaysUntilConference(conf)
                  return (
                    <Card key={conf.id} className="border-2 hover:shadow-xl transition-shadow">
                      <CardContent className="p-8">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-6 h-6 text-primary-foreground" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h4 className="text-2xl font-bold text-foreground">{getConferenceName(conf)}</h4>
                              {daysLeft !== null && daysLeft <= 14 && (
                                <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {daysLeft} {t("days_left")}
                                </span>
                              )}
                            </div>
                            <p className="text-muted-foreground mb-4">{getConferenceDate(conf)}</p>
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/conferences/${conf.id}`}>{t("learn_more")}</Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
            <div className="text-center mt-8">
              <Button asChild variant="outline" size="lg">
                <Link href="/calendar">
                  <Calendar className="mr-2 h-4 w-4" />
                  {t("calendar_view")}
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
