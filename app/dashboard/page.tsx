"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useLanguage } from "@/contexts/language-context"
import type { User } from "@supabase/supabase-js"
import { Calendar, Home, UserCircle, Upload, Plus, FileText, Inbox } from "lucide-react"
import type { UserProfile } from "@/lib/roles"
import { getRoleBadgeColor, getRoleLabel } from "@/lib/roles"
import { Input } from "@/components/ui/input"

interface Registration {
  id: string
  conference: string
  full_name: string
  school: string
  email: string
  grade: number
  created_at: string
}

interface DelegateApplication {
  id: string
  conference_id: string
  full_name: string
  email: string
  phone: string
  motivation: string
  status: string
  created_at: string
  primary_committee: { id: string; name: string; topic: string | null } | null
  secondary_committee: { id: string; name: string; topic: string | null } | null
  third_committee: { id: string; name: string; topic: string | null } | null
}

interface ConferenceWithApplications {
  id: string
  name_ru: string
  name_kk: string
  name_en: string
  date_ru: string
  date_kk: string
  date_en: string
  city: string
  location: string
  applications: DelegateApplication[]
  registration_open: boolean
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [myConferences, setMyConferences] = useState<ConferenceWithApplications[]>([])
  const [bio, setBio] = useState("")
  const [photoUrl, setPhotoUrl] = useState("")
  const [fullName, setFullName] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const router = useRouter()
  const { t, language } = useLanguage()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle()

        if (!profileData && !profileError) {
          const { data: newProfile } = await supabase
            .from("profiles")
            .insert({
              user_id: user.id,
              full_name: user.email?.split("@")[0] || "User",
              role: "participant",
              region: null,
            })
            .select()
            .single()

          if (newProfile) {
            setProfile(newProfile)
            setFullName(newProfile.full_name || "")
          }
        } else if (profileData) {
          setProfile(profileData)
          setBio(profileData.bio || "")
          setPhotoUrl(profileData.photo_url || "")
          setFullName(profileData.full_name || "")
        }

        const { data: regs } = await supabase
          .from("registrations")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (regs) {
          setRegistrations(regs)
        }

        if (profileData?.role === "general_secretary" || profileData?.role === "founder") {
          const { data: conferencesData } = await supabase
            .from("user_conferences")
            .select("*")
            .eq("creator_id", user.id)
            .order("created_at", { ascending: false })

          if (conferencesData) {
            const conferencesWithApps = await Promise.all(
              conferencesData.map(async (conf) => {
                const { data: apps } = await supabase
                  .from("delegate_applications")
                  .select("*")
                  .eq("conference_id", conf.id)
                  .order("created_at", { ascending: false })

                return {
                  ...conf,
                  applications: apps || [],
                }
              }),
            )
            setMyConferences(conferencesWithApps)
          }
        }
      }

      setLoading(false)
    }
    getUser()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const handleSaveProfile = async () => {
    if (!user || !profile) return
    setIsSaving(true)

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          bio,
          photo_url: photoUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)

      if (error) throw error

      setProfile({ ...profile, full_name: fullName, bio, photo_url: photoUrl })
      setIsEditing(false)
    } catch (error) {
      console.error("Error updating profile:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload-photo", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const data = await response.json()
      setPhotoUrl(data.url)

      if (profile) {
        setProfile({ ...profile, photo_url: data.url })
      }
    } catch (error) {
      console.error("Error uploading photo:", error)
      alert("Failed to upload photo. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  const canCreateConference =
    profile?.role === "general_secretary" || profile?.role === "deputy" || profile?.role === "founder"

  const isGenSecOrFounder = profile?.role === "general_secretary" || profile?.role === "founder"

  async function handleDeleteConference(conferenceId: string, conferenceName: string) {
    if (!confirm(`${t("confirm_delete_conference")}\n\n${conferenceName}`)) {
      return
    }

    try {
      const { data, error } = await supabase.rpc('delete_conference', {
        conf_id: conferenceId
      })

      if (error) throw error

      if (data === false) {
        alert("Permission denied - only owner can delete")
        return
      }

      alert(t("conference_deleted"))
      
      // Reload conferences
      const { data: conferencesData } = await supabase
        .from("user_conferences")
        .select("*")
        .eq("creator_id", user?.id)
        .order("created_at", { ascending: false })

      if (conferencesData) {
        const conferencesWithApps = await Promise.all(
          conferencesData.map(async (conf) => {
            const { data: apps } = await supabase
              .from("delegate_applications")
              .select("*")
              .eq("conference_id", conf.id)
              .order("created_at", { ascending: false })

            return {
              ...conf,
              applications: apps || [],
            }
          }),
        )
        setMyConferences(conferencesWithApps)
      }
    } catch (error) {
      console.error("[v0] Error deleting conference:", error)
      alert("Error: " + (error as Error).message)
    }
  }

  async function handleToggleRegistration(conferenceId: string, currentStatus: boolean, conferenceName: string) {
    const action = currentStatus ? t("close_registration") : t("open_registration")

    if (currentStatus && !confirm(`${t("confirm_close_registration")}\n\n${conferenceName}`)) {
      return
    }

    try {
      const { data, error } = await supabase.rpc('toggle_conference_registration', {
        conf_id: conferenceId,
        is_open: !currentStatus
      })

      if (error) throw error

      if (data === false) {
        alert("Permission denied - only owner can toggle registration")
        return
      }

      if (currentStatus) {
        const conference = myConferences.find((c) => c.id === conferenceId)
        if (conference) {
          const newsTitle = {
            ru: `Регистрация на ${conference.name_ru} закрыта`,
            kk: `${conference.name_kk} тіркелуі жабылды`,
            en: `Registration for ${conference.name_en} is closed`,
          }

          const newsContent = {
            ru: `Регистрация на конференцию ${conference.name_ru} официально закрыта. Конференция состоится ${conference.date_ru} в ${conference.location}. Всем зарегистрированным делегатам будет отправлена дополнительная информация. Желаем успехов всем участникам!`,
            kk: `${conference.name_kk} конференциясына тіркелу ресми түрде жабылды. Конференция ${conference.date_kk} күні ${conference.location} өтеді. Барлық тіркелген делегаттарға қосымша ақпарат жіберіледі. Барлық қатысушыларға сәттілік тілейміз!`,
            en: `Registration for ${conference.name_en} conference is officially closed. The conference will take place on ${conference.date_en} at ${conference.location}. Additional information will be sent to all registered delegates. We wish all participants success!`,
          }

          await supabase.from("news").insert({
            title_ru: newsTitle.ru,
            title_kk: newsTitle.kk,
            title_en: newsTitle.en,
            content_ru: newsContent.ru,
            content_kk: newsContent.kk,
            content_en: newsContent.en,
            author_id: user?.id,
          })
        }
      }

      alert(t("registration_status_updated"))

      const { data: conferencesData } = await supabase
        .from("user_conferences")
        .select("*")
        .eq("creator_id", user?.id)
        .order("created_at", { ascending: false })

      if (conferencesData) {
        const conferencesWithApps = await Promise.all(
          conferencesData.map(async (conf) => {
            const { data: apps } = await supabase
              .from("delegate_applications")
              .select("*")
              .eq("conference_id", conf.id)
              .order("created_at", { ascending: false })

            return {
              ...conf,
              applications: apps || [],
            }
          }),
        )
        setMyConferences(conferencesWithApps)
      }
    } catch (error) {
      console.error("[v0] Error toggling registration:", error)
      alert("Error: " + (error as Error).message)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p>{t("loading")}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex gap-3 flex-wrap">
          <Button asChild variant="outline">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              {t("go_to_home")}
            </Link>
          </Button>
          <Button asChild className="bg-[#006633] hover:bg-[#004d26]">
            <Link href="/register">
              <Calendar className="mr-2 h-4 w-4" />
              {t("register_for_conference")}
            </Link>
          </Button>
          {canCreateConference && (
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link href="/create-conference">
                <Plus className="mr-2 h-4 w-4" />
                {t("create_conference")}
              </Link>
            </Button>
          )}
          {isGenSecOrFounder && (
            <>
              <Button asChild className="bg-purple-600 hover:bg-purple-700">
                <Link href="/news/create">
                  <FileText className="mr-2 h-4 w-4" />
                  {t("quick_create_news")}
                </Link>
              </Button>
              <Button asChild className="bg-orange-600 hover:bg-orange-700">
                <Link href="/inbox">
                  <Inbox className="mr-2 h-4 w-4" />
                  {t("inbox")}
                </Link>
              </Button>
            </>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="h-5 w-5" />
              {t("dashboard")}
            </CardTitle>
            <CardDescription>{t("welcome_back")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={photoUrl || undefined} alt={profile?.full_name} />
                  <AvatarFallback className="text-2xl">{profile?.full_name?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                {isEditing && (
                  <label
                    htmlFor="photo-upload"
                    className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full cursor-pointer hover:bg-black/60 transition-colors"
                  >
                    <Upload className="h-6 w-6 text-white" />
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                      disabled={isUploading}
                    />
                  </label>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-semibold">{profile?.full_name}</h3>
                  {profile?.role && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(profile.role)}`}>
                      {getRoleLabel(profile.role, language)}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <span className="font-medium">Email:</span> {user?.email}
                  </p>
                  {profile?.phone && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <span className="font-medium">{t("phone")}:</span> {profile.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-4 pt-4 border-t">
                <div className="grid gap-2">
                  <Label htmlFor="full-name">{t("display_name")}</Label>
                  <p className="text-sm text-muted-foreground">{t("display_name_desc")}</p>
                  <Input
                    id="full-name"
                    placeholder="Введите ваше имя"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>{t("profile_photo")}</Label>
                  <p className="text-sm text-muted-foreground">{t("click_avatar_to_upload")}</p>
                  {isUploading && <p className="text-sm text-blue-600">{t("uploading")}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bio">{t("bio")}</Label>
                  <Textarea
                    id="bio"
                    placeholder={t("bio_placeholder")}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveProfile} disabled={isSaving} className="bg-[#006633] hover:bg-[#004d26]">
                    {isSaving ? t("saving") : t("save")}
                  </Button>
                  <Button onClick={() => setIsEditing(false)} variant="outline">
                    {t("cancel")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-4 border-t">
                {bio && (
                  <div>
                    <p className="text-sm font-medium mb-1">{t("bio")}</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{bio}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button onClick={() => setIsEditing(true)} variant="outline">
                    {t("edit_profile")}
                  </Button>
                  <Button onClick={handleLogout} variant="outline">
                    {t("logout")}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {isGenSecOrFounder && myConferences.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t("my_conferences_and_applications")}
              </CardTitle>
              <CardDescription>
                {myConferences.length} {t("conference")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {myConferences.map((conf) => (
                  <div key={conf.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-semibold text-lg">
                          {language === "ru" ? conf.name_ru : language === "kk" ? conf.name_kk : conf.name_en}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {language === "ru" ? conf.date_ru : language === "kk" ? conf.date_kk : conf.date_en}
                        </p>
                        <p className="text-sm text-muted-foreground">{conf.location}</p>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {conf.applications.length} {t("applications")}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            conf.registration_open ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {conf.registration_open ? t("registration_open") : t("registration_closed")}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={conf.registration_open ? "destructive" : "default"}
                            onClick={() => handleToggleRegistration(conf.id, conf.registration_open, conf.name_ru)}
                            className={!conf.registration_open ? "bg-green-600 hover:bg-green-700" : ""}
                          >
                            {conf.registration_open ? t("close_registration") : t("open_registration")}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteConference(conf.id, conf.name_ru)}
                          >
                            {t("delete")}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {conf.applications.length > 0 && (
                      <div className="pt-3 border-t space-y-3">
                        <p className="text-sm font-medium">{t("delegate_applications_label")}:</p>
                        {conf.applications.map((app) => (
                          <div key={app.id} className="bg-muted/50 rounded-lg p-3 space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">{app.full_name}</p>
                                <p className="text-sm text-muted-foreground">{app.email}</p>
                                <p className="text-sm text-muted-foreground">{app.phone}</p>
                              </div>
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  app.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : app.status === "approved"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                }`}
                              >
                                {app.status === "pending"
                                  ? t("status_pending")
                                  : app.status === "approved"
                                    ? t("approved")
                                    : t("rejected")}
                              </span>
                            </div>
                            {(app.primary_committee || app.secondary_committee || app.third_committee) && (
                              <div className="pt-2 border-t space-y-1">
                                <p className="text-xs font-medium text-muted-foreground mb-1">{t("committee_choices")}:</p>
                                {app.primary_committee && (
                                  <p className="text-sm">
                                    <span className="font-medium">1:</span> {app.primary_committee.name}
                                    {app.primary_committee.topic && ` - ${app.primary_committee.topic}`}
                                  </p>
                                )}
                                {app.secondary_committee && (
                                  <p className="text-sm">
                                    <span className="font-medium">2:</span> {app.secondary_committee.name}
                                    {app.secondary_committee.topic && ` - ${app.secondary_committee.topic}`}
                                  </p>
                                )}
                                {app.third_committee && (
                                  <p className="text-sm">
                                    <span className="font-medium">3:</span> {app.third_committee.name}
                                    {app.third_committee.topic && ` - ${app.third_committee.topic}`}
                                  </p>
                                )}
                              </div>
                            )}
                            {app.motivation && (
                              <div className="pt-2 border-t">
                                <p className="text-xs font-medium text-muted-foreground mb-1">{t("motivation_letter")}:</p>
                                <p className="text-sm">{app.motivation}</p>
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {t("submitted_on")}: {new Date(app.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{t("my_registrations")}</CardTitle>
            <CardDescription>
              {registrations.length > 0
                ? `${registrations.length} ${registrations.length === 1 ? "регистрация" : "регистраций"}`
                : t("no_registrations")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {registrations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">{t("no_registrations")}</p>
                <Button asChild className="bg-[#006633] hover:bg-[#004d26]">
                  <Link href="/register">{t("register_for_conference")}</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {registrations.map((reg) => (
                  <div key={reg.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-semibold text-lg">{reg.conference}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {t("registered_on")} {new Date(reg.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="font-medium">{reg.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {t(`city_${reg.school}`)} • {t("grade")} {reg.grade}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
