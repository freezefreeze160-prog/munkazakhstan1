"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { createBrowserClient } from "@/lib/supabase/client"
import { useLanguage } from "@/contexts/language-context"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Clock, ArrowLeft, CreditCard, FileText, Bookmark, BookmarkCheck } from "lucide-react"
import { ConferenceDocuments } from "@/components/conference-documents"
import { PaymentReceiptUpload } from "@/components/payment-receipt-upload"
import { ConferenceGallery } from "@/components/conference-gallery"
import { ConferenceCertificate } from "@/components/conference-certificate"

interface Conference {
  id: string
  name_ru: string
  name_kk: string
  name_en: string
  date_ru: string
  date_kk: string
  date_en: string
  time: string
  location: string
  city: string
  description_ru: string
  description_kk: string
  description_en: string
  conditions_ru: string
  conditions_kk: string
  conditions_en: string
  organizer_contact: string
  creator_id: string | null
  poster_url: string | null
  registration_fee_amount: number | null
  registration_fee_currency: string | null
  payment_bank: string | null
  payment_card_number: string | null
  payment_card_holder: string | null
  payment_instructions: string | null
}

export default function ConferenceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { t, language } = useLanguage()
  const supabase = createBrowserClient()
  const [conference, setConference] = useState<Conference | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [isOrganizer, setIsOrganizer] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [favLoading, setFavLoading] = useState(false)

  useEffect(() => {
    loadConference()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  async function loadConference() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUserId(user?.id || null)

      const { data, error } = await supabase.from("user_conferences").select("*").eq("id", params.id).single()

      if (error) throw error

      setConference(data)

      if (user) {
        const isCreator = data?.creator_id === user.id
        let hasElevatedRole = false
        if (!isCreator) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("role")
            .eq("user_id", user.id)
            .maybeSingle()
          hasElevatedRole =
            profileData?.role === "founder" || profileData?.role === "general_secretary"
        }
        setIsOrganizer(isCreator || hasElevatedRole)

        const { data: fav } = await supabase
          .from("conference_favorites")
          .select("id")
          .eq("conference_id", params.id)
          .eq("user_id", user.id)
          .maybeSingle()
        setIsFavorite(!!fav)
      }
    } catch (error) {
      console.error("[v0] Error loading conference:", error)
    } finally {
      setLoading(false)
    }
  }

  async function toggleFavorite() {
    if (!userId) {
      router.push("/auth/login")
      return
    }
    setFavLoading(true)
    try {
      if (isFavorite) {
        await supabase
          .from("conference_favorites")
          .delete()
          .eq("conference_id", params.id)
          .eq("user_id", userId)
        setIsFavorite(false)
      } else {
        await supabase
          .from("conference_favorites")
          .insert({ conference_id: params.id as string, user_id: userId })
        setIsFavorite(true)
      }
    } catch (error) {
      console.error("Error toggling favorite:", error)
    } finally {
      setFavLoading(false)
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

  if (!conference) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">{t("conference_not_found")}</p>
              <Button asChild>
                <Link href="/conferences">{t("view_conferences")}</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  const name = language === "ru" ? conference.name_ru : language === "kk" ? conference.name_kk : conference.name_en
  const date = language === "ru" ? conference.date_ru : language === "kk" ? conference.date_kk : conference.date_en
  const description =
    language === "ru"
      ? conference.description_ru
      : language === "kk"
        ? conference.description_kk
        : conference.description_en
  const conditions =
    language === "ru"
      ? conference.conditions_ru
      : language === "kk"
        ? conference.conditions_kk
        : conference.conditions_en

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Cinematic hero */}
        <section className="relative">
          <div className="absolute inset-0 overflow-hidden">
            {conference.poster_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={conference.poster_url}
                alt=""
                aria-hidden
                className="w-full h-full object-cover scale-110 blur-2xl opacity-40"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/5" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/75 to-background" />
          </div>

          <div className="relative container mx-auto px-4 max-w-4xl pt-6 pb-8">
            <Button asChild variant="ghost" className="mb-6 -ml-2">
              <Link href="/conferences">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t("view_conferences")}
              </Link>
            </Button>

            <div className="flex flex-col sm:flex-row gap-6">
              {/* Poster */}
              <div className="w-40 sm:w-52 flex-shrink-0 mx-auto sm:mx-0">
                <div className="aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border border-border/40 bg-muted">
                  {conference.poster_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={conference.poster_url} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Calendar className="w-10 h-10 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 flex flex-col justify-end">
                <h1 className="text-3xl md:text-5xl font-bold text-foreground text-balance">{name}</h1>
                <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-4 text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {date}
                  </span>
                  {conference.time && (
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {conference.time}
                    </span>
                  )}
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {conference.location}
                  </span>
                </div>

                <div className="flex flex-wrap gap-3 mt-6">
                  {userId ? (
                    <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                      <Link href={`/conferences/${conference.id}/apply`}>{t("apply_to_conference")}</Link>
                    </Button>
                  ) : (
                    <Button asChild size="lg" variant="outline">
                      <Link href="/auth/login">{t("login_to_apply")}</Link>
                    </Button>
                  )}
                  <Button
                    onClick={toggleFavorite}
                    disabled={favLoading}
                    size="lg"
                    variant={isFavorite ? "default" : "outline"}
                  >
                    {isFavorite ? (
                      <>
                        <BookmarkCheck className="w-4 h-4 mr-2" />
                        {t("in_favorites")}
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-4 h-4 mr-2" />
                        {t("add_to_favorites")}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 max-w-4xl pb-12">
          <Card>
            <CardContent className="space-y-6 pt-6">
              {description && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">{t("conference_description")}</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{description}</p>
                </div>
              )}

              {conditions && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">{t("conference_conditions")}</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{conditions}</p>
                </div>
              )}

              {conference.organizer_contact && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">{t("organizer_contact")}</h3>
                  <p className="text-muted-foreground">{conference.organizer_contact}</p>
                </div>
              )}

              {/* Documents: Background Guides & Position Papers */}
              <div className="border rounded-lg p-5">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-lg">{t("documents")}</h3>
                </div>
                <ConferenceDocuments conferenceId={conference.id} userId={userId} isOrganizer={isOrganizer} />
              </div>

              {/* Photo gallery */}
              <ConferenceGallery conferenceId={conference.id} userId={userId} isOrganizer={isOrganizer} />

              {/* Certificates */}
              <ConferenceCertificate conferenceId={conference.id} userId={userId} isOrganizer={isOrganizer} />

              {/* Payment Details */}
              {(conference.payment_bank || conference.payment_card_number) && (
                <div className="border rounded-lg p-5 bg-muted/30">
                  <div className="flex items-center gap-2 mb-4">
                    <CreditCard className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-lg">{t("payment_details")}</h3>
                  </div>

                  {conference.registration_fee_amount && (
                    <div className="mb-3">
                      <span className="text-sm text-muted-foreground">{t("registration_fee")}:</span>
                      <p className="font-bold text-xl text-foreground">
                        {conference.registration_fee_amount.toLocaleString()} {conference.registration_fee_currency || "KZT"}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    {conference.payment_bank && (
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-sm text-muted-foreground">{t("payment_bank")}:</span>
                        <span className="font-medium text-foreground">{conference.payment_bank}</span>
                      </div>
                    )}
                    {conference.payment_card_number && (
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-sm text-muted-foreground">{t("payment_card_number")}:</span>
                        <span className="font-mono font-medium text-foreground">{conference.payment_card_number}</span>
                      </div>
                    )}
                    {conference.payment_card_holder && (
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-sm text-muted-foreground">{t("payment_card_holder")}:</span>
                        <span className="font-medium text-foreground">{conference.payment_card_holder}</span>
                      </div>
                    )}
                  </div>

                  {conference.payment_instructions && (
                    <div className="mt-4 p-3 bg-background rounded-md border">
                      <span className="text-sm font-medium text-foreground">{t("payment_instructions")}:</span>
                      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                        {conference.payment_instructions}
                      </p>
                    </div>
                  )}

                  {/* Delegate uploads a payment receipt here */}
                  {userId && <PaymentReceiptUpload conferenceId={conference.id} userId={userId} />}
                </div>
              )}

              <div className="pt-4 border-t">
                {userId ? (
                  <Button asChild className="w-full bg-primary hover:bg-primary/90" size="lg">
                    <Link href={`/conferences/${conference.id}/apply`}>{t("apply_to_conference")}</Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild className="w-full" size="lg" variant="outline">
                      <Link href="/auth/login">{t("login_to_apply")}</Link>
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
