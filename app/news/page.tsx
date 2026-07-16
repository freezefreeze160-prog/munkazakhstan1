"use client"

import { useEffect, useState } from "react"
import { useLanguage } from "@/contexts/language-context"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { Plus, Pencil, Trash2, AlertCircle } from "lucide-react"
import Link from "next/link"
import type { UserProfile } from "@/lib/roles"

interface NewsArticle {
  id: string
  title_ru: string
  title_kk: string
  title_en: string
  content_ru: string
  content_kk: string
  content_en: string
  author_id: string
  created_at: string
  updated_at: string
}

export default function NewsPage() {
  const { t, language } = useLanguage()
  const [news, setNews] = useState<NewsArticle[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [tableExists, setTableExists] = useState(true)
  const supabase = createClient()

  const canManageNews = profile?.role === "founder" || profile?.role === "general_secretary"

  useEffect(() => {
    const fetchData = async () => {
      // Fetch user profile
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: profileData } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle()
        if (profileData) {
          setProfile(profileData)
        }
      }

      const { data: newsData, error } = await supabase
        .from("news")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] Error fetching news:", error)
        // Only set tableExists to false if it's actually a missing table error
        if (error.code === "42P01" || error.message?.includes("does not exist")) {
          setTableExists(false)
        }
      } else {
        setNews(newsData || [])
        setTableExists(true)
      }
      setLoading(false)
    }

    fetchData()
  }, [supabase])

  const handleDelete = async (id: string) => {
    if (!confirm(t("confirm_delete_news"))) return

    const { error } = await supabase.from("news").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting news:", error)
      alert("Failed to delete news")
    } else {
      setNews(news.filter((item) => item.id !== id))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-12">
          <div className="container mx-auto px-4">
            <p className="text-center">{t("loading")}</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold text-foreground">{t("news_title")}</h1>
            {canManageNews && tableExists && (
              <Button asChild className="bg-[#006633] hover:bg-[#004d26]">
                <Link href="/news/create">
                  <Plus className="mr-2 h-4 w-4" />
                  {t("create_news")}
                </Link>
              </Button>
            )}
          </div>

          <p className="text-center text-muted-foreground mb-8 text-lg">{t("news_desc")}</p>

          {!tableExists && canManageNews && (
            <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 mb-6">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                      {language === "ru"
                        ? "Таблица новостей не создана"
                        : language === "kk"
                          ? "Жаңалықтар кестесі жасалмаған"
                          : "News table not created"}
                    </h3>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      {language === "ru"
                        ? "Пожалуйста, запустите SQL скрипт 'scripts/005_create_news_table.sql' в интерфейсе v0, чтобы создать таблицу новостей в базе данных."
                        : language === "kk"
                          ? "Жаңалықтар кестесін жасау үшін v0 интерфейсінде 'scripts/005_create_news_table.sql' SQL скриптін іске қосыңыз."
                          : "Please run the SQL script 'scripts/005_create_news_table.sql' in the v0 interface to create the news table in the database."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {!tableExists && !canManageNews && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {language === "ru"
                  ? "Раздел новостей находится в разработке"
                  : language === "kk"
                    ? "Жаңалықтар бөлімі әзірленуде"
                    : "News section is under development"}
              </p>
            </div>
          )}

          {tableExists && news.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t("no_news")}</p>
            </div>
          )}

          {tableExists && news.length > 0 && (
            <div className="space-y-6">
              {news.map((item) => (
                <Card key={item.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-foreground">
                          {language === "ru" ? item.title_ru : language === "kk" ? item.title_kk : item.title_en}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(item.created_at).toLocaleDateString(language)}
                        </p>
                      </div>
                      {canManageNews && (
                        <div className="flex gap-2">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/news/edit/${item.id}`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                      {language === "ru" ? item.content_ru : language === "kk" ? item.content_kk : item.content_en}
                    </p>
                  </CardContent>
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
