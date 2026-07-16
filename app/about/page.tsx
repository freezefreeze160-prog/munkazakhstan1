"use client"

import { useLanguage } from "@/contexts/language-context"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Globe, Users, Award, BookOpen, MessageSquare, Target } from "lucide-react"

export default function AboutPage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <div className="inline-block p-3 bg-primary/10 rounded-full mb-4">
              <Globe className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-5xl font-bold mb-4 text-foreground">{t("about_title")}</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{t("about_desc")}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <Card className="border-2 hover:border-primary transition-colors">
              <CardContent className="p-8">
                <div className="bg-primary/10 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-bold text-xl mb-3 text-foreground">{t("about_international")}</h3>
                <p className="text-muted-foreground leading-relaxed">{t("about_international_desc")}</p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors">
              <CardContent className="p-8">
                <div className="bg-primary/10 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                  <MessageSquare className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-bold text-xl mb-3 text-foreground">{t("about_diplomacy")}</h3>
                <p className="text-muted-foreground leading-relaxed">{t("about_diplomacy_desc")}</p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors">
              <CardContent className="p-8">
                <div className="bg-primary/10 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                  <BookOpen className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-bold text-xl mb-3 text-foreground">{t("about_critical_thinking")}</h3>
                <p className="text-muted-foreground leading-relaxed">{t("about_critical_thinking_desc")}</p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors">
              <CardContent className="p-8">
                <div className="bg-primary/10 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-bold text-xl mb-3 text-foreground">{t("about_networking")}</h3>
                <p className="text-muted-foreground leading-relaxed">{t("about_networking_desc")}</p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors">
              <CardContent className="p-8">
                <div className="bg-primary/10 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                  <Award className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-bold text-xl mb-3 text-foreground">{t("about_leadership")}</h3>
                <p className="text-muted-foreground leading-relaxed">{t("about_leadership_desc")}</p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors">
              <CardContent className="p-8">
                <div className="bg-primary/10 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                  <Target className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-bold text-xl mb-3 text-foreground">{t("about_achievements")}</h3>
                <p className="text-muted-foreground leading-relaxed">{t("about_achievements_desc")}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-to-br from-primary to-primary/80 text-white">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">{t("about_cta_title")}</h2>
              <p className="text-lg mb-6 text-white/90">{t("about_cta_desc")}</p>
              <a
                href="/register"
                className="inline-block bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-white/90 transition-colors"
              >
                {t("register")}
              </a>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
