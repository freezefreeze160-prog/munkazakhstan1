"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useLanguage } from "@/contexts/language-context"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"
import Link from "next/link"

interface NewsItem {
  id: string
  title_ru: string
  title_kk: string
  title_en: string
  content_ru: string
  content_kk: string
  content_en: string
  image_url: string | null
  published: boolean
  created_at: string
}

export default function NewsManagement() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const { t, language } = useLanguage()
  const supabase = createClient()

  useEffect(() => {
    loadNews()
  }, [])

  async function loadNews() {
    try {
      const { data } = await supabase.from("news").select("*").order("created_at", { ascending: false })

      setNews(data || [])
    } catch (error) {
      console.error("[v0] Error loading news:", error)
    } finally {
      setLoading(false)
    }
  }

  async function deleteNews(id: string) {
    if (!confirm(t("confirm_delete_news"))) return

    try {
      const { error } = await supabase.from("news").delete().eq("id", id)

      if (error) throw error

      alert(t("news_deleted"))
      loadNews()
    } catch (error) {
      console.error("[v0] Error deleting news:", error)
      alert(t("error_occurred"))
    }
  }

  if (loading) {
    return <p className="text-center text-muted-foreground">{t("loading")}</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t("manage_news")}</h2>
        <Link href="/news/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t("create_news")}
          </Button>
        </Link>
      </div>

      {news.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">{t("no_news")}</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {news.map((item) => {
            const title = language === "ru" ? item.title_ru : language === "kk" ? item.title_kk : item.title_en
            const content = language === "ru" ? item.content_ru : language === "kk" ? item.content_kk : item.content_en

            return (
              <Card key={item.id} className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">{title}</h3>
                    <p className="text-muted-foreground line-clamp-3">{content}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(item.created_at).toLocaleDateString(language)}
                    </p>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => deleteNews(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
