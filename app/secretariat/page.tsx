"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/contexts/language-context"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"
import type { UserProfile } from "@/lib/roles"
import Link from "next/link"

export default function SecretariatPage() {
  const { t, language } = useLanguage()
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_team_member", true)
        .order("created_at", { ascending: true })

      if (data && !error) {
        setProfiles(data)
      } else {
        setProfiles([])
      }
      setLoading(false)
    }

    fetchProfiles()
  }, [supabase])

  // Group team members by section
  const getTeamSection = (teamRole: string | null | undefined): string => {
    if (!teamRole) return "other"
    const role = teamRole.toLowerCase()
    if (role.includes("founder")) return "founders"
    if (role.includes("content")) return "content"
    if (role.includes("design")) return "designers"
    if (role.includes("partnership")) return "partnership"
    if (role.includes("marketing")) return "other"
    if (role.includes("community")) return "other"
    return "other"
  }

  const teamSections = {
    founders: profiles.filter(p => getTeamSection(p.team_role) === "founders"),
    content: profiles.filter(p => getTeamSection(p.team_role) === "content"),
    designers: profiles.filter(p => getTeamSection(p.team_role) === "designers"),
    partnership: profiles.filter(p => getTeamSection(p.team_role) === "partnership"),
    other: profiles.filter(p => getTeamSection(p.team_role) === "other"),
  }

  const renderTeamSection = (title: string, members: UserProfile[]) => {
    if (members.length === 0) return null
    return (
      <div key={title} className="mb-16">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold text-foreground mb-3 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {title}
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto"></div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
          {members.map((profile) => (
            <Link key={profile.id} href={`/profile/${profile.user_id}`} className="w-full max-w-sm">
              <Card className="group hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer h-full border-2 hover:border-primary/50">
                <CardContent className="p-8 flex flex-col items-center text-center gap-5">
                  <div className="relative">
                    <Avatar className="h-36 w-36 ring-4 ring-primary/10 group-hover:ring-primary/30 transition-all">
                      <AvatarImage src={profile.photo_url || undefined} alt={profile.full_name} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-white text-4xl font-bold">
                        {profile.full_name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-background px-3 py-1 rounded-full shadow-lg border-2 border-primary/20">
                      {profile.team_role && (
                        <span className="text-xs font-semibold text-primary whitespace-nowrap">
                          {profile.team_role}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 mt-4">
                    <h3 className="font-bold text-2xl text-foreground group-hover:text-primary transition-colors">
                      {profile.full_name}
                    </h3>
                    {profile.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed px-2">
                        {profile.bio}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-16 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
              {t("secretariat_title")}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {t("secretariat_desc")}
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t("loading")}</p>
            </div>
          ) : profiles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t("no_secretariat_for_city")}</p>
            </div>
          ) : (
            <div>
              {renderTeamSection(t("team_founders"), teamSections.founders)}
              {renderTeamSection(t("team_content_managers"), teamSections.content)}
              {renderTeamSection(t("team_designers"), teamSections.designers)}
              {renderTeamSection(t("team_partnership_managers"), teamSections.partnership)}
              {teamSections.other.length > 0 && renderTeamSection(t("team_other"), teamSections.other)}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
