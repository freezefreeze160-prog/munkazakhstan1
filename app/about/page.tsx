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

      <main className="flex-1">
        {/* Video-background hero */}
        <section className="relative overflow-hidden">
          <video
            className="absolute inset-0 w-full h-full object-cover"
            src="/landing.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />
          {/* Dark overlay so the text stays readable */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-background" />
          <div className="relative z-10 container mx-auto px-4 max-w-4xl py-24 md:py-32 text-center">
            <div className="inline-block p-3 bg-white/10 backdrop-blur-sm rounded-full mb-6 border border-white/20">
              <Globe className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4 text-white drop-shadow-lg">{t("about_title")}</h1>
            <p className="text-lg md:text-2xl text-white/90 font-medium mb-4 drop-shadow">
              {t("about_hero_tagline")}
            </p>
            <p className="text-base md:text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
              {t("about_desc")}
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 max-w-6xl py-12">
          {/* Our story */}
          <div className="max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-6 text-foreground text-center">{t("about_story_title")}</h2>
            <div className="space-y-4 text-muted-foreground text-lg leading-relaxed">
              <p>{t("about_story_p1")}</p>
              <p>{t("about_story_p2")}</p>
              <p>{t("about_story_p3")}</p>
            </div>
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

          {/* Our team */}
          <Card className="border-2 mb-12">
            <CardContent className="p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-4 text-foreground">{t("about_team_title")}</h2>
                  <p className="text-muted-foreground text-lg leading-relaxed">{t("about_team_desc")}</p>
                  <a
                    href="/secretariat"
                    className="inline-block mt-6 text-primary font-semibold hover:underline"
                  >
                    {t("secretariat")} →
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

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
