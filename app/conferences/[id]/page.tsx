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
import { Calendar, MapPin, Clock, ArrowLeft, CreditCard, FileText, Bookmark, BookmarkCheck, Pencil } from "lucide-react"
import { ConferenceDocuments } from "@/components/conference-documents"
import { PaymentReceiptUpload } from "@/components/payment-receipt-upload"
import { ConferenceGallery } from "@/components/conference-gallery"
import { ConferenceCertificate } from "@/components/conference-certificate"
import { ConferenceSchedule } from "@/components/conference-schedule"
import { formatConfDate } from "@/lib/format-date"
import { REGIONS } from "@/lib/roles"

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
  registration_open: boolean | null
  registration_deadline: string | null
  languages: string[] | null
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
            profileData?.role === "founder" ||
            profileData?.role === "general_secretary" ||
            profileData?.role === "admin"
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
  const date = formatConfDate(
    language === "ru" ? conference.date_ru : language === "kk" ? conference.date_kk : conference.date_en,
  )
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

  const deadlinePassed =
    !!conference.registration_deadline && new Date(conference.registration_deadline) < new Date()
  // Treat null registration_open as open (legacy conferences without the flag)
  const registrationClosed = conference.registration_open === false || deadlinePassed

  const cityName =
    conference.city && REGIONS[Number(conference.city) as keyof typeof REGIONS]
      ? REGIONS[Number(conference.city) as keyof typeof REGIONS][language]
      : ""

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Cinematic hero — Kinopoisk-style */}
        <section className="relative overflow-hidden min-h-[85vh] flex items-center">
          {/* Backdrop: poster fills the right, fades into darkness on the left */}
          <div className="absolute inset-0">
            {conference.poster_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={conference.poster_url}
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-black" />
            )}
            {/* Dark cinematic fade: solid black on the left, smoothly revealing
                the image toward the right (stronger in the middle). */}
            <div className="absolute inset-0 bg-gradient-to-r from-black from-5% via-black/85 via-45% to-black/30 to-95%" />
            {/* Blend the bottom into the page background */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
            {/* Extra darkening on mobile for readability */}
            <div className="absolute inset-0 bg-black/45 md:bg-transparent" />
          </div>

          {/* Back link */}
          <div className="absolute top-4 inset-x-0 z-20">
            <div className="container mx-auto px-4 max-w-6xl">
              <Button asChild variant="ghost" className="-ml-2 text-white/80 hover:text-white hover:bg-white/10">
                <Link href="/conferences">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t("view_conferences")}
                </Link>
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="relative z-10 w-full container mx-auto px-4 max-w-6xl py-20">
            <div className="max-w-2xl">
              <h1 className="text-5xl md:text-7xl font-extrabold text-white text-balance tracking-tight drop-shadow-2xl">
                {name}
              </h1>

              {/* Meta line: year · Model UN · city */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-4 text-sm md:text-base text-white/70">
                {conference.date_ru?.slice(0, 4) && <span>{conference.date_ru.slice(0, 4)}</span>}
                <span className="text-white/40">•</span>
                <span>Model UN</span>
                {cityName && (
                  <>
                    <span className="text-white/40">•</span>
                    <span>{cityName}</span>
                  </>
                )}
              </div>

              {/* Badge row: languages, fee, status */}
              <div className="flex flex-wrap items-center gap-2 mt-4">
                {(conference.languages || []).map((lang) => (
                  <span
                    key={lang}
                    className="text-xs font-semibold px-2.5 py-1 rounded-md bg-white/15 text-white border border-white/20 backdrop-blur-sm"
                  >
                    {lang}
                  </span>
                ))}
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-white/15 text-white border border-white/20 backdrop-blur-sm">
                  {conference.registration_fee_amount
                    ? `${conference.registration_fee_amount.toLocaleString()} ${conference.registration_fee_currency || "KZT"}`
                    : language === "ru"
                      ? "Бесплатно"
                      : language === "kk"
                        ? "Тегін"
                        : "Free"}
                </span>
                {registrationClosed && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-red-500/20 text-red-300 border border-red-500/30">
                    {t("registration_closed")}
                  </span>
                )}
              </div>

              {/* Meta details */}
              <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-5 text-white/70 text-sm">
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

              {/* Short description */}
              {description && (
                <p className="mt-5 text-white/75 max-w-xl line-clamp-3 leading-relaxed">{description}</p>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3 mt-7">
                {registrationClosed ? (
                  <Button size="lg" variant="outline" disabled className="rounded-full border-white/30 text-white bg-transparent">
                    {t("registration_closed")}
                  </Button>
                ) : userId ? (
                  <Button
                    asChild
                    size="lg"
                    className="rounded-full px-8 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-white shadow-lg shadow-primary/30"
                  >
                    <Link href={`/conferences/${conference.id}/apply`}>{t("apply_to_conference")}</Link>
                  </Button>
                ) : (
                  <Button asChild size="lg" className="rounded-full px-8 bg-gradient-to-r from-primary to-indigo-600 text-white">
                    <Link href="/auth/login">{t("login_to_apply")}</Link>
                  </Button>
                )}
                <Button
                  onClick={toggleFavorite}
                  disabled={favLoading}
                  size="lg"
                  variant="outline"
                  className="rounded-full border-white/30 text-white bg-white/5 hover:bg-white/15 hover:text-white"
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
                {isOrganizer && (
                  <Button asChild size="lg" variant="outline" className="rounded-full border-white/30 text-white bg-white/5 hover:bg-white/15 hover:text-white">
                    <Link href={`/conferences/${conference.id}/edit`}>
                      <Pencil className="w-4 h-4 mr-2" />
                      {t("edit_conference")}
                    </Link>
                  </Button>
                )}
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

              {/* Schedule / agenda */}
              <ConferenceSchedule conferenceId={conference.id} isOrganizer={isOrganizer} />

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
                {registrationClosed ? (
                  <div className="text-center">
                    <Button className="w-full" size="lg" variant="outline" disabled>
                      {t("registration_closed")}
                    </Button>
                    {deadlinePassed && conference.registration_deadline && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {t("registration_deadline")}:{" "}
                        {new Date(conference.registration_deadline).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ) : userId ? (
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
