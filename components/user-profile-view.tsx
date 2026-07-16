"use client"

import { useEffect, useState } from "react"
import { useLanguage } from "@/contexts/language-context"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Phone, MapPin, Calendar, Mail } from "lucide-react"
import { getRoleBadgeColor, getRoleLabel, regions } from "@/lib/roles"
import type { UserProfile } from "@/lib/roles"

export function UserProfileView({ userId }: { userId: string }) {
  const { language, t } = useLanguage()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [email, setEmail] = useState<string>("")
  const [loading, setLoading] = useState(true)
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

          // If viewing own profile, show email from session
          if (currentUser?.id === userId) {
            setEmail(currentUser.email || "")
          } else {
            // For other users' profiles, we can't access their email directly for privacy
            // But we can show it if they made it public or if we have admin access
            // For now, we'll leave it empty for privacy
            setEmail("")
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
