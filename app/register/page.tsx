"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useLanguage } from "@/contexts/language-context"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { formatConfDate } from "@/lib/format-date"
import { Calendar, MapPin, ArrowRight, Info } from "lucide-react"

interface Conference {
  id: string
  name_ru: string
  name_kk: string
  name_en: string
  date_ru: string
  date_kk: string
  date_en: string
  location: string
  created_at: string
  registration_deadline: string | null
}

// Single entry point for delegate registration: pick a conference, then
// continue to the full application form at /conferences/[id]/apply.
export default function RegisterPage() {
  const { t, language } = useLanguage()
  const router = useRouter()
  const supabase = createClient()
  const [conferences, setConferences] = useState<Conference[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)
      try {
        const { data } = await supabase
          .from("user_conferences")
          .select(
            "id, name_ru, name_kk, name_en, date_ru, date_kk, date_en, location, created_at, registration_deadline",
          )
          .eq("status", "published")
          .eq("registration_open", true)
          .order("created_at", { ascending: false })
        // Drop conferences whose registration deadline has already passed
        const open = (data || []).filter(
          (c) => !c.registration_deadline || new Date(c.registration_deadline) >= new Date(),
        )
        setConferences(open)
      } catch (e) {
        console.error("[v0] Error loading conferences:", e)
      } finally {
        setLoading(false)
      }
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function getName(c: Conference) {
    return language === "ru" ? c.name_ru : language === "kk" ? c.name_kk : c.name_en
  }
  function getDate(c: Conference) {
    return formatConfDate(language === "ru" ? c.date_ru : language === "kk" ? c.date_kk : c.date_en)
  }

  function handleContinue() {
    if (!selected) return
    if (!isAuthenticated) {
      router.push("/auth/login")
      return
    }
    router.push(`/conferences/${selected}/apply`)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <h1 className="text-4xl font-bold mb-2 text-center text-foreground">{t("register_title")}</h1>
          <p className="text-center text-muted-foreground mb-8">{t("register_pick_desc")}</p>

          <Card>
            <CardHeader>
              <CardTitle>{t("select_conference")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? (
                <p className="text-center text-muted-foreground py-6">{t("loading")}</p>
              ) : conferences.length === 0 ? (
                <div className="text-center py-6 space-y-4">
                  <p className="text-muted-foreground">{t("no_conferences")}</p>
                  <Button asChild variant="outline">
                    <Link href="/conferences">{t("all_conferences")}</Link>
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid gap-2">
                    <Label>
                      {t("conference")} <span className="text-red-500">*</span>
                    </Label>
                    <Select value={selected} onValueChange={setSelected}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("select_conference")} />
                      </SelectTrigger>
                      <SelectContent>
                        {conferences.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            <div className="flex flex-col gap-1 py-1">
                              <div className="font-semibold">{getName(c)}</div>
                              <div className="text-xs text-muted-foreground flex items-center gap-3">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {getDate(c)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {c.location}
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {!isAuthenticated && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-2">
                      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-800 dark:text-blue-300">{t("login_required_to_apply")}</p>
                    </div>
                  )}

                  <Button
                    onClick={handleContinue}
                    disabled={!selected}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    {t("continue_to_form")}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
