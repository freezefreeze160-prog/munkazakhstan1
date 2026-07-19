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
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, MapPin, Info, Search, DollarSign, ArrowDownUp } from "lucide-react"
import { REGIONS } from "@/lib/roles"

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
  poster_url: string | null
  registration_fee_amount: number | null
  registration_fee_currency: string | null
  date_start: string | null
}

export default function ConferencesPage() {
  const { t, language } = useLanguage()
  const router = useRouter()
  const supabase = createBrowserClient()
  const [conferences, setConferences] = useState<Conference[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [cityFilter, setCityFilter] = useState("all")
  const [feeFilter, setFeeFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")

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

  // Cities that actually have conferences (for the filter dropdown)
  const cityNums = Array.from(new Set(conferences.map((c) => String(c.city)).filter((v) => v && v !== "null")))

  const filtered = conferences
    .filter((c) => {
      const matchesQuery =
        !query.trim() || getConferenceName(c).toLowerCase().includes(query.trim().toLowerCase())
      const matchesCity = cityFilter === "all" || String(c.city) === cityFilter
      const fee = Number(c.registration_fee_amount) || 0
      const matchesFee =
        feeFilter === "all" || (feeFilter === "free" ? fee <= 0 : fee > 0)
      return matchesQuery && matchesCity && matchesFee
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        // Upcoming first; conferences without a start date go last
        if (!a.date_start) return 1
        if (!b.date_start) return -1
        return a.date_start.localeCompare(b.date_start)
      }
      if (sortBy === "fee_asc") {
        return (Number(a.registration_fee_amount) || 0) - (Number(b.registration_fee_amount) || 0)
      }
      // newest (default): most recently created first
      return (b.created_at || "").localeCompare(a.created_at || "")
    })

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-6">
            <h1 className="text-4xl font-bold mb-2">{t("all_conferences")}</h1>
            <p className="text-muted-foreground">{t("available_conferences")}</p>
          </div>

          {/* Search + city filter */}
          {!loading && conferences.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 mb-8">
              <div className="relative flex-1 sm:min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("search_conferences")}
                  className="pl-9"
                />
              </div>
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <MapPin className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("all_cities")}</SelectItem>
                  {cityNums.map((num) => (
                    <SelectItem key={num} value={num}>
                      {REGIONS[Number(num) as keyof typeof REGIONS]?.[language] || num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={feeFilter} onValueChange={setFeeFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <DollarSign className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("fee_all")}</SelectItem>
                  <SelectItem value="free">{t("fee_free")}</SelectItem>
                  <SelectItem value="paid">{t("fee_paid")}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-48">
                  <ArrowDownUp className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">{t("sort_newest")}</SelectItem>
                  <SelectItem value="date">{t("sort_by_date")}</SelectItem>
                  <SelectItem value="fee_asc">{t("sort_by_fee")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t("loading")}</p>
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">{t("no_conferences")}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {filtered.map((conf) => (
                <Card key={conf.id} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-row">
                  {/* Poster */}
                  <Link
                    href={`/conferences/${conf.id}`}
                    className="w-28 sm:w-36 flex-shrink-0 bg-muted relative"
                  >
                    {conf.poster_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={conf.poster_url}
                        alt={getConferenceName(conf)}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Calendar className="w-8 h-8 text-muted-foreground/40" />
                      </div>
                    )}
                  </Link>

                  <div className="flex-1 min-w-0 flex flex-col">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg leading-snug">
                        <Link href={`/conferences/${conf.id}`} className="hover:text-primary transition-colors">
                          {getConferenceName(conf)}
                        </Link>
                      </CardTitle>
                      <CardDescription className="space-y-1 pt-1">
                        <span className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          {getConferenceDate(conf)}
                        </span>
                        <span className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{conf.location}</span>
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 mt-auto">
                      {getConferenceDescription(conf) && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {getConferenceDescription(conf)}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button asChild size="sm" className="flex-1 bg-primary hover:bg-primary/90" disabled={!userId}>
                          <Link href={`/conferences/${conf.id}/apply`}>{t("apply_to_conference")}</Link>
                        </Button>
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/conferences/${conf.id}`}>
                            <Info className="w-4 h-4" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </div>
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
