"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { createBrowserClient } from "@/lib/supabase/client"
import { useLanguage } from "@/contexts/language-context"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ConferencesMap } from "@/components/conferences-map"
import type { MapCityGroup } from "@/components/conferences-map-inner"
import { REGIONS } from "@/lib/roles"
import { CITY_COORDINATES } from "@/lib/city-coordinates"
import { MapPin } from "lucide-react"

interface Conference {
  id: string
  name_ru: string
  name_kk: string
  name_en: string
  date_ru: string
  date_kk: string
  date_en: string
  city: string | null
  status: string
}

export default function MapPage() {
  const { t, language } = useLanguage()
  const [conferences, setConferences] = useState<Conference[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConferences()
  }, [])

  async function loadConferences() {
    try {
      setLoading(true)
      const client = createBrowserClient()
      const { data, error } = await client
        .from("user_conferences")
        .select("id, name_ru, name_kk, name_en, date_ru, date_kk, date_en, city, status")
        .eq("status", "published")
      if (error) throw error
      setConferences(data || [])
    } catch (err) {
      console.error("Error loading conferences for map:", err)
      setConferences([])
    } finally {
      setLoading(false)
    }
  }

  function confName(c: Conference) {
    return language === "ru" ? c.name_ru : language === "kk" ? c.name_kk : c.name_en
  }
  function confDate(c: Conference) {
    return language === "ru" ? c.date_ru : language === "kk" ? c.date_kk : c.date_en
  }

  const cityGroups: MapCityGroup[] = useMemo(() => {
    const groups: Record<number, MapCityGroup> = {}
    for (const conf of conferences) {
      const region = Number(conf.city)
      if (!region || !CITY_COORDINATES[region]) continue
      const coords = CITY_COORDINATES[region]
      const cityName = REGIONS[region as keyof typeof REGIONS]?.[language] || String(conf.city)
      if (!groups[region]) {
        groups[region] = { region, cityName, lat: coords.lat, lng: coords.lng, conferences: [] }
      }
      groups[region].conferences.push({ id: conf.id, name: confName(conf), date: confDate(conf) })
    }
    return Object.values(groups)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conferences, language])

  const mapLabels = { conferences: t("conferences_count_label"), learnMore: t("learn_more") }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-3">
              <MapPin className="w-7 h-7 text-primary" />
              <h1 className="text-3xl md:text-5xl font-bold text-foreground">{t("map_title")}</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t("map_desc")}</p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="rounded-2xl overflow-hidden border border-border shadow-sm h-[420px] md:h-[560px]">
              {loading ? (
                <div className="h-full w-full flex items-center justify-center bg-muted/40">
                  <p className="text-muted-foreground">{t("loading")}</p>
                </div>
              ) : (
                <ConferencesMap cityGroups={cityGroups} labels={mapLabels} />
              )}
            </div>

            {/* City list under the map */}
            {!loading && (
              <div className="mt-8">
                {cityGroups.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">{t("no_conferences")}</p>
                    <Button asChild variant="outline">
                      <Link href="/conferences">{t("view_conferences")}</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cityGroups
                      .slice()
                      .sort((a, b) => b.conferences.length - a.conferences.length)
                      .map((group) => (
                        <Card key={group.region} className="border hover:border-primary/50 transition-colors">
                          <CardContent className="p-5">
                            <div className="flex items-center gap-2 mb-3">
                              <MapPin className="w-4 h-4 text-primary" />
                              <h3 className="font-bold text-foreground">{group.cityName}</h3>
                              <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                                {group.conferences.length}
                              </span>
                            </div>
                            <ul className="space-y-2">
                              {group.conferences.map((conf) => (
                                <li key={conf.id}>
                                  <Link
                                    href={`/conferences/${conf.id}`}
                                    className="text-sm text-foreground hover:text-primary font-medium transition-colors block truncate"
                                  >
                                    {conf.name}
                                  </Link>
                                  {conf.date && <span className="text-xs text-muted-foreground">{conf.date}</span>}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
