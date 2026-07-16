"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/contexts/language-context"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function CreateNewsPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const supabase = createClient()

  const [titleRu, setTitleRu] = useState("")
  const [titleKk, setTitleKk] = useState("")
  const [titleEn, setTitleEn] = useState("")
  const [contentRu, setContentRu] = useState("")
  const [contentKk, setContentKk] = useState("")
  const [contentEn, setContentEn] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuthorization = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).single()

      if (profile?.role === "founder") {
        setIsAuthorized(true)
      } else {
        alert("Только основатель может создавать новости")
        router.push("/news")
      }

      setLoading(false)
    }

    checkAuthorization()
  }, [supabase, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { error } = await supabase.from("news").insert({
        title_ru: titleRu,
        title_kk: titleKk,
        title_en: titleEn,
        content_ru: contentRu,
        content_kk: contentKk,
        content_en: contentEn,
        author_id: user.id,
      })

      if (error) throw error

      alert(t("news_created"))
      router.push("/news")
    } catch (error) {
      console.error("[v0] Error creating news:", error)
      alert("Failed to create news")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p>{t("loading")}</p>
        </main>
        <Footer />
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <Button asChild variant="outline" className="mb-6 bg-transparent">
            <Link href="/news">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("news_title")}
            </Link>
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>{t("create_news")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title-ru">{t("news_title_field")} (Русский)</Label>
                    <Input
                      id="title-ru"
                      value={titleRu}
                      onChange={(e) => setTitleRu(e.target.value)}
                      required
                      placeholder="Заголовок новости на русском"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="title-kk">{t("news_title_field")} (Қазақша)</Label>
                    <Input
                      id="title-kk"
                      value={titleKk}
                      onChange={(e) => setTitleKk(e.target.value)}
                      required
                      placeholder="Жаңалық тақырыбы қазақ тілінде"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="title-en">{t("news_title_field")} (English)</Label>
                    <Input
                      id="title-en"
                      value={titleEn}
                      onChange={(e) => setTitleEn(e.target.value)}
                      required
                      placeholder="News title in English"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="content-ru">{t("news_content")} (Русский)</Label>
                    <Textarea
                      id="content-ru"
                      value={contentRu}
                      onChange={(e) => setContentRu(e.target.value)}
                      required
                      rows={6}
                      placeholder="Содержание новости на русском"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="content-kk">{t("news_content")} (Қазақша)</Label>
                    <Textarea
                      id="content-kk"
                      value={contentKk}
                      onChange={(e) => setContentKk(e.target.value)}
                      required
                      rows={6}
                      placeholder="Жаңалық мазмұны қазақ тілінде"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="content-en">{t("news_content")} (English)</Label>
                    <Textarea
                      id="content-en"
                      value={contentEn}
                      onChange={(e) => setContentEn(e.target.value)}
                      required
                      rows={6}
                      placeholder="News content in English"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" disabled={isSubmitting} className="bg-[#006633] hover:bg-[#004d26]">
                    {isSubmitting ? t("saving") : t("create")}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => router.back()}>
                    {t("cancel")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
