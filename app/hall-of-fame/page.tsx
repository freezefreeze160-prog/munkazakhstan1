"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useLanguage } from "@/contexts/language-context"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, Star, Award } from "lucide-react"

interface DelegateProfile {
  user_id: string
  full_name: string
  avatar_url: string | null
  conferences_count: number
  awards_count: number
}

type DelegateLevel = "bronze" | "silver" | "gold"

function getDelegateLevel(conferencesCount: number): DelegateLevel {
  if (conferencesCount >= 6) return "gold"
  if (conferencesCount >= 3) return "silver"
  return "bronze"
}

function getLevelColor(level: DelegateLevel) {
  switch (level) {
    case "gold":
      return "bg-yellow-100 text-yellow-800 border-yellow-300"
    case "silver":
      return "bg-gray-100 text-gray-700 border-gray-300"
    case "bronze":
      return "bg-orange-100 text-orange-800 border-orange-300"
  }
}

function getLevelIcon(level: DelegateLevel) {
  switch (level) {
    case "gold":
      return <Trophy className="w-5 h-5 text-yellow-600" />
    case "silver":
      return <Medal className="w-5 h-5 text-gray-500" />
    case "bronze":
      return <Star className="w-5 h-5 text-orange-600" />
  }
}

export default function HallOfFamePage() {
  const { t } = useLanguage()
  const [delegates, setDelegates] = useState<DelegateProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTopDelegates()
  }, [])

  async function loadTopDelegates() {
    try {
      const client = createBrowserClient()

      const { data: registrations } = await client
        .from("registrations")
        .select("user_id, status")
        .eq("status", "approved")

      if (!registrations || registrations.length === 0) {
        setDelegates([])
        setLoading(false)
        return
      }

      const userCounts: Record<string, number> = {}
      for (const reg of registrations) {
        userCounts[reg.user_id] = (userCounts[reg.user_id] || 0) + 1
      }

      const sortedUserIds = Object.entries(userCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 20)
        .map(([id]) => id)

      if (sortedUserIds.length === 0) {
        setDelegates([])
        setLoading(false)
        return
      }

      const { data: profiles } = await client
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", sortedUserIds)

      const delegateProfiles: DelegateProfile[] = sortedUserIds
        .map((userId) => {
          const profile = profiles?.find((p) => p.user_id === userId)
          return {
            user_id: userId,
            full_name: profile?.full_name || "Delegate",
            avatar_url: profile?.avatar_url || null,
            conferences_count: userCounts[userId],
            awards_count: 0,
          }
        })
        .filter((d) => d.full_name !== "Delegate")

      setDelegates(delegateProfiles)
    } catch (error) {
      console.error("Error loading hall of fame:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 mb-4">
                <Trophy className="w-8 h-8 text-yellow-500" />
                <h1 className="text-3xl md:text-5xl font-bold text-foreground">
                  {t("hall_of_fame")}
                </h1>
                <Trophy className="w-8 h-8 text-yellow-500" />
              </div>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t("hall_of_fame_desc")}
              </p>
            </div>

            {/* Level System Explanation */}
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-16">
              <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-background">
                <CardContent className="p-6 text-center">
                  <Star className="w-10 h-10 text-orange-500 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-foreground mb-1">{t("bronze_delegate")}</h3>
                  <p className="text-sm text-muted-foreground">{t("level_bronze_desc")}</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-gray-300 bg-gradient-to-br from-gray-50 to-background">
                <CardContent className="p-6 text-center">
                  <Medal className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-foreground mb-1">{t("silver_delegate")}</h3>
                  <p className="text-sm text-muted-foreground">{t("level_silver_desc")}</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-yellow-300 bg-gradient-to-br from-yellow-50 to-background">
                <CardContent className="p-6 text-center">
                  <Trophy className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-foreground mb-1">{t("gold_delegate")}</h3>
                  <p className="text-sm text-muted-foreground">{t("level_gold_desc")}</p>
                </CardContent>
              </Card>
            </div>

            {/* Top Delegates */}
            <h2 className="text-2xl font-bold text-center mb-8 text-foreground">
              {t("top_delegates")}
            </h2>

            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">{t("loading")}</p>
              </div>
            ) : delegates.length === 0 ? (
              <div className="text-center py-12">
                <Award className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {t("no_conferences")}
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {delegates.map((delegate, index) => {
                  const level = getDelegateLevel(delegate.conferences_count)
                  return (
                    <Card
                      key={delegate.user_id}
                      className={`border-2 hover:shadow-lg transition-all ${
                        index === 0
                          ? "border-yellow-300 shadow-yellow-100"
                          : index === 1
                            ? "border-gray-300"
                            : index === 2
                              ? "border-orange-200"
                              : "border-border"
                      }`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="relative">
                            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                              {delegate.avatar_url ? (
                                <img
                                  src={delegate.avatar_url}
                                  alt={delegate.full_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-xl font-bold text-primary">
                                  {delegate.full_name.charAt(0)}
                                </span>
                              )}
                            </div>
                            {index < 3 && (
                              <span className="absolute -top-1 -right-1 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                                {index + 1}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-foreground truncate">
                              {delegate.full_name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant="outline"
                                className={`text-xs ${getLevelColor(level)}`}
                              >
                                {getLevelIcon(level)}
                                <span className="ml-1">
                                  {level === "gold"
                                    ? t("gold_delegate")
                                    : level === "silver"
                                      ? t("silver_delegate")
                                      : t("bronze_delegate")}
                                </span>
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                              {delegate.conferences_count} {t("conferences_attended")}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
