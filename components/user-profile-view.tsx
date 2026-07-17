"use client"

import { useEffect, useState } from "react"
import { useLanguage } from "@/contexts/language-context"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Phone, MapPin, Calendar, Mail, Trophy, Medal, Star, Award } from "lucide-react"
import { getRoleBadgeColor, getRoleLabel, regions } from "@/lib/roles"
import type { UserProfile } from "@/lib/roles"
import { computeScore, levelFromScore, awardLabelKey, type AwardType, type DelegateLevel } from "@/lib/awards"

interface Stats {
  conferences: number
  committees: number
  awards: AwardType[]
  level: DelegateLevel
}

function levelIcon(level: DelegateLevel) {
  if (level === "gold") return <Trophy className="w-4 h-4 text-yellow-600" />
  if (level === "silver") return <Medal className="w-4 h-4 text-gray-500" />
  return <Star className="w-4 h-4 text-orange-600" />
}

function levelColor(level: DelegateLevel) {
  if (level === "gold") return "bg-yellow-100 text-yellow-800 border-yellow-300"
  if (level === "silver") return "bg-gray-100 text-gray-700 border-gray-300"
  return "bg-orange-100 text-orange-800 border-orange-300"
}

export function UserProfileView({ userId }: { userId: string }) {
  const { language, t } = useLanguage()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [email, setEmail] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle()

      if (error) {
        console.error("[v0] Error fetching profile:", error)
      } else {
        setProfile(data)

        if (data) {
          const {
            data: { user: currentUser },
          } = await supabase.auth.getUser()

          if (currentUser?.id === userId) {
            setEmail(currentUser.email || "")
          } else {
            setEmail("")
          }

          // Load achievement stats
          try {
            const [appsRes, awardsRes] = await Promise.all([
              supabase
                .from("delegate_applications")
                .select("assigned_committee_id, status")
                .eq("user_id", userId)
                .eq("status", "approved"),
              supabase.from("conference_awards").select("award_type").eq("user_id", userId),
            ])
            const apps = appsRes.data || []
            const conferences = apps.length
            const committees = new Set(
              apps.filter((a) => a.assigned_committee_id).map((a) => a.assigned_committee_id),
            ).size
            const awards = (awardsRes.data || []).map((a) => a.award_type as AwardType)
            const score = computeScore(conferences, awards)
            setStats({ conferences, committees, awards, level: levelFromScore(score) })
          } catch (statsErr) {
            console.error("Error loading stats:", statsErr)
          }
        }
      }
      setLoading(false)
    }

    fetchProfile()
  }, [userId, supabase])

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t("loading")}</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t("profile_not_found")}</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-start gap-6">
            <Avatar className="w-32 h-32">
              <AvatarImage src={profile.photo_url || undefined} alt={profile.full_name} />
              <AvatarFallback className="text-4xl">{profile.full_name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-3xl mb-3">{profile.full_name}</CardTitle>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge className={getRoleBadgeColor(profile.role)}>{getRoleLabel(profile.role, language)}</Badge>
                {stats && stats.conferences > 0 && (
                  <Badge variant="outline" className={`flex items-center gap-1 ${levelColor(stats.level)}`}>
                    {levelIcon(stats.level)}
                    {stats.level === "gold"
                      ? t("gold_delegate")
                      : stats.level === "silver"
                        ? t("silver_delegate")
                        : t("bronze_delegate")}
                  </Badge>
                )}
                {profile.region && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {regions[profile.region as keyof typeof regions]?.[language]}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Achievements */}
          {stats && (stats.conferences > 0 || stats.awards.length > 0) && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                {t("achievements")}
              </h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="rounded-xl border bg-muted/30 p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{stats.conferences}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t("conferences_attended")}</p>
                </div>
                <div className="rounded-xl border bg-muted/30 p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{stats.committees}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t("committees")}</p>
                </div>
                <div className="rounded-xl border bg-muted/30 p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{stats.awards.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t("awards_received")}</p>
                </div>
              </div>
              {stats.awards.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {stats.awards.map((award, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="bg-yellow-50 text-yellow-800 border-yellow-300 flex items-center gap-1"
                    >
                      <Award className="w-3.5 h-3.5" />
                      {t(awardLabelKey(award) as never)}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {profile.bio && (
            <div>
              <h3 className="text-lg font-semibold mb-2">{t("bio")}</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{profile.bio}</p>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold mb-3">{t("contact_info")}</h3>
            <div className="space-y-2">
              {profile.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{profile.phone}</span>
                </div>
              )}
              {email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span>{email}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>
                  {t("member_since")} {new Date(profile.created_at).toLocaleDateString(language)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
