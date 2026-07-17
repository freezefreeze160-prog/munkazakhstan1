"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useLanguage } from "@/contexts/language-context"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, Star, Award } from "lucide-react"
import {
  computeScore,
  levelFromScore,
  awardLabelKey,
  type AwardType,
  type DelegateLevel,
} from "@/lib/awards"

interface DelegateProfile {
  user_id: string
  full_name: string
  avatar_url: string | null
  conferences_count: number
  awards_count: number
  top_award: AwardType | null
  score: number
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

      // Conferences attended = approved delegate applications
      const { data: applications } = await client
        .from("delegate_applications")
        .select("user_id, status")
        .eq("status", "approved")

      const userCounts: Record<string, number> = {}
      for (const app of applications || []) {
        if (app.user_id) userCounts[app.user_id] = (userCounts[app.user_id] || 0) + 1
      }

      // All awards
      const { data: awards } = await client
        .from("conference_awards")
        .select("user_id, award_type")

      const userAwards: Record<string, AwardType[]> = {}
      for (const aw of awards || []) {
        if (!aw.user_id) continue
        if (!userAwards[aw.user_id]) userAwards[aw.user_id] = []
        userAwards[aw.user_id].push(aw.award_type as AwardType)
        // Anyone with an award also counts as having attended, even if no approved app row
        if (userCounts[aw.user_id] === undefined) userCounts[aw.user_id] = 1
      }

      const candidateIds = Object.keys(userCounts)
      if (candidateIds.length === 0) {
        setDelegates([])
        setLoading(false)
        return
      }

      const { data: profiles } = await client
        .from("profiles")
        .select("user_id, full_name, photo_url")
        .in("user_id", candidateIds)

      // Award ranking for picking the "top" award to display
      const awardRank: Record<AwardType, number> = {
        best_delegate: 5,
        outstanding_delegate: 4,
        best_position_paper: 3,
        honorable_mention: 2,
        participation: 1,
      }

      const delegateProfiles: DelegateProfile[] = candidateIds
        .map((userId) => {
          const profile = profiles?.find((p) => p.user_id === userId)
          const awardsForUser = userAwards[userId] || []
          const topAward =
            awardsForUser.length > 0
              ? awardsForUser.reduce((best, a) => (awardRank[a] > awardRank[best] ? a : best))
              : null
          return {
            user_id: userId,
            full_name: profile?.full_name || "",
            avatar_url: profile?.photo_url || null,
            conferences_count: userCounts[userId],
            awards_count: awardsForUser.length,
            top_award: topAward,
            score: computeScore(userCounts[userId], awardsForUser),
          }
        })
        .filter((d) => d.full_name.trim() !== "")
        .sort((a, b) => b.score - a.score)
        .slice(0, 20)

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
                  const level = levelFromScore(delegate.score)
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
                            {delegate.top_award && (
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <Award className="w-3.5 h-3.5 text-yellow-600" />
                                <span className="text-xs font-medium text-yellow-700">
                                  {t(awardLabelKey(delegate.top_award) as never)}
                                  {delegate.awards_count > 1 && ` +${delegate.awards_count - 1}`}
                                </span>
                              </div>
                            )}
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
