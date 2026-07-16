"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useLanguage } from "@/contexts/language-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, FileText, Inbox, Home } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import AdminPanel from "@/components/admin-panel"
import ConferenceApprovals from "@/components/conference-approvals"
import NewsManagement from "@/components/news-management"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [isFounder, setIsFounder] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { t } = useLanguage()
  const supabase = createClient()

  useEffect(() => {
    checkAccess()
  }, [])

  async function checkAccess() {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) {
        console.log("[v0] Auth error:", authError)
        setError("auth_error")
        setLoading(false)
        return
      }

      if (!user) {
        setError("not_logged_in")
        setLoading(false)
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single()

      if (profileError) {
        console.log("[v0] Profile error:", profileError)
        setError("profile_not_found")
        setLoading(false)
        return
      }

      if (profile?.role !== "founder") {
        setError("not_founder")
        setLoading(false)
        return
      }

      setIsFounder(true)
      setLoading(false)
    } catch (err) {
      console.error("[v0] Check access error:", err)
      setError("unknown_error")
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">{t("loading")}</p>
        </main>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <p className="text-destructive font-medium">
              {error === "not_logged_in" && t("please_login")}
              {error === "not_founder" && t("access_denied")}
              {error === "profile_not_found" && t("profile_not_found")}
              {error === "auth_error" && t("auth_error")}
              {error === "unknown_error" && t("error_occurred")}
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild>
                <Link href="/auth/login">{t("login")}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/">{t("go_to_home")}</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!isFounder) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold text-foreground">{t("admin_panel")}</h1>
            <Button asChild variant="outline">
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                {t("go_to_home")}
              </Link>
            </Button>
          </div>

          <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="users">
                <Users className="h-4 w-4 mr-2" />
                {t("manage_users")}
              </TabsTrigger>
              <TabsTrigger value="conferences">
                <Inbox className="h-4 w-4 mr-2" />
                {t("conference_approvals")}
              </TabsTrigger>
              <TabsTrigger value="news">
                <FileText className="h-4 w-4 mr-2" />
                {t("manage_news")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="mt-6">
              <AdminPanel />
            </TabsContent>

            <TabsContent value="conferences" className="mt-6">
              <ConferenceApprovals />
            </TabsContent>

            <TabsContent value="news" className="mt-6">
              <NewsManagement />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  )
}
