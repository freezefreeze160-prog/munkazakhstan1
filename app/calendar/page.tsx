"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useLanguage } from "@/contexts/language-context"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarIcon, MapPin, ChevronLeft, ChevronRight, Clock } from "lucide-react"
import Link from "next/link"

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
  created_at: string
  status: string
}

interface ParsedConference extends Conference {
  startDate: Date | null
  endDate: Date | null
  startDay: number | null
  endDay: number | null
  month: number | null
  year: number | null
}

const monthNames = {
  ru: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
  kk: ["Қаңтар", "Ақпан", "Наурыз", "Сәуір", "Мамыр", "Маусым", "Шілде", "Тамыз", "Қыркүйек", "Қазан", "Қараша", "Желтоқсан"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
}

const dayNames = {
  ru: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
  kk: ["Дс", "Сс", "Ср", "Бс", "Жм", "Сб", "Жс"],
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
}

export default function CalendarPage() {
  const { t, language } = useLanguage()
  const supabase = createBrowserClient()
  const [conferences, setConferences] = useState<ParsedConference[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedConference, setSelectedConference] = useState<ParsedConference | null>(null)

  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  useEffect(() => {
    loadConferences()
  }, [])

  function parseConferenceDate(conf: Conference): ParsedConference {
    const dateStr = conf.date_en || conf.date_ru || conf.date_kk
    console.log("[v0] Parsing conference date:", conf.name_en, dateStr)
    
    // Try multiple formats
    // Format 1: "19-20 апреля 2026" (Russian range)
    const rangeMatch = dateStr?.match(/(\d+)[-–](\d+)\s+(\w+)\s+(\d{4})/)
    if (rangeMatch) {
      const [, startDay, endDay, month, year] = rangeMatch
      const monthMap: { [key: string]: number } = {
        января: 0, февраля: 1, марта: 2, апреля: 3, мая: 4, июня: 5,
        июля: 6, августа: 7, сентября: 8, октября: 9, ноября: 10, декабря: 11,
        january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
        july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
      }
      const monthNum = monthMap[month.toLowerCase()]
      if (monthNum !== undefined) {
        const startDate = new Date(Number.parseInt(year), monthNum, Number.parseInt(startDay))
        const endDate = new Date(Number.parseInt(year), monthNum, Number.parseInt(endDay))
        console.log("[v0] Parsed range:", startDate, "to", endDate)
        return {
          ...conf,
          startDate,
          endDate,
          startDay: Number.parseInt(startDay),
          endDay: Number.parseInt(endDay),
          month: monthNum,
          year: Number.parseInt(year)
        }
      }
    }
    
    // Format 2: "April 19, 2026" (English single day)
    const singleDayMatch = dateStr?.match(/(\w+)\s+(\d+),?\s+(\d{4})/)
    if (singleDayMatch) {
      const [, month, day, year] = singleDayMatch
      const monthMap: { [key: string]: number } = {
        january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
        july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
        января: 0, февраля: 1, марта: 2, апреля: 3, мая: 4, июня: 5,
        июля: 6, августа: 7, сентября: 8, октября: 9, ноября: 10, декабря: 11,
      }
      const monthNum = monthMap[month.toLowerCase()]
      if (monthNum !== undefined) {
        const date = new Date(Number.parseInt(year), monthNum, Number.parseInt(day))
        console.log("[v0] Parsed single day:", date)
        return {
          ...conf,
          startDate: date,
          endDate: date,
          startDay: Number.parseInt(day),
          endDay: Number.parseInt(day),
          month: monthNum,
          year: Number.parseInt(year)
        }
      }
    }
    
    console.log("[v0] Could not parse date:", dateStr)
    return { ...conf, startDate: null, endDate: null, startDay: null, endDay: null, month: null, year: null }
  }

  async function loadConferences() {
    try {
      const { data, error } = await supabase
        .from("user_conferences")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false })

      if (error) throw error

      const parsed = (data || []).map(parseConferenceDate)
      setConferences(parsed)
    } catch (error) {
      console.error("[v0] Error loading conferences:", error)
    } finally {
      setLoading(false)
    }
  }

  function getConferenceName(conf: Conference) {
    return language === "ru" ? conf.name_ru : language === "kk" ? conf.name_kk : conf.name_en
  }

  function getConferenceDate(conf: Conference) {
    return language === "ru" ? conf.date_ru : language === "kk" ? conf.date_kk : conf.date_en
  }

  function getDaysInMonth(month: number, year: number) {
    return new Date(year, month + 1, 0).getDate()
  }

  function getFirstDayOfMonth(month: number, year: number) {
    const day = new Date(year, month, 1).getDay()
    return day === 0 ? 6 : day - 1 // Convert Sunday=0 to Monday=0 format
  }

  function getConferencesForDay(day: number): ParsedConference[] {
    return conferences.filter(conf => {
      if (conf.month !== currentMonth || conf.year !== currentYear) return false
      if (conf.startDay && conf.endDay) {
        return day >= conf.startDay && day <= conf.endDay
      }
      return false
    })
  }

  function isConferenceStart(day: number, conf: ParsedConference): boolean {
    return conf.startDay === day && conf.month === currentMonth && conf.year === currentYear
  }

  function isConferenceEnd(day: number, conf: ParsedConference): boolean {
    return conf.endDay === day && conf.month === currentMonth && conf.year === currentYear
  }

  function goToPreviousMonth() {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
    setSelectedConference(null)
  }

  function goToNextMonth() {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
    setSelectedConference(null)
  }

  function goToToday() {
    setCurrentDate(new Date())
    setSelectedConference(null)
  }

  const daysInMonth = getDaysInMonth(currentMonth, currentYear)
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear)
  const today = new Date()
  const isToday = (day: number) => 
    day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()

  // Generate calendar grid
  const calendarDays: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null)
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  // Get unique conferences for this month
  const monthConferences = conferences.filter(conf => 
    conf.month === currentMonth && conf.year === currentYear
  )

  // Conference color palette
  const conferenceColors = [
    "bg-primary",
    "bg-blue-500",
    "bg-violet-500",
    "bg-cyan-500",
    "bg-indigo-500",
  ]

  function getConferenceColor(index: number): string {
    return conferenceColors[index % conferenceColors.length]
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">{t("calendar_view")}</h1>
              <p className="text-muted-foreground mt-1">{t("upcoming_desc")}</p>
            </div>
            <Button variant="outline" onClick={goToToday}>
              {language === "ru" ? "Сегодня" : language === "kk" ? "Бүгін" : "Today"}
            </Button>
          </div>

          <div className="grid lg:grid-cols-[1fr,380px] gap-6">
            {/* Calendar Grid */}
            <Card className="overflow-hidden">
              <div className="p-4 border-b bg-muted/30">
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <h2 className="text-xl font-semibold text-foreground">
                    {monthNames[language as keyof typeof monthNames][currentMonth]} {currentYear}
                  </h2>
                  <Button variant="ghost" size="icon" onClick={goToNextMonth}>
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="p-4">
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {dayNames[language as keyof typeof dayNames].map((day, i) => (
                    <div key={i} className="text-center text-sm font-medium text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                {loading ? (
                  <div className="h-96 flex items-center justify-center">
                    <p className="text-muted-foreground">{t("loading")}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, index) => {
                      const dayConferences = day ? getConferencesForDay(day) : []
                      const hasConference = dayConferences.length > 0
                      
                      return (
                        <div
                          key={index}
                          className={`
                            relative min-h-[80px] md:min-h-[100px] p-1 rounded-lg border transition-colors
                            ${day ? 'bg-background hover:bg-muted/50 cursor-pointer' : 'bg-muted/20'}
                            ${isToday(day || 0) ? 'border-primary border-2' : 'border-border/50'}
                            ${hasConference ? 'ring-1 ring-primary/20' : ''}
                          `}
                          onClick={() => {
                            if (dayConferences.length > 0) {
                              setSelectedConference(dayConferences[0])
                            }
                          }}
                        >
                          {day && (
                            <>
                              <span className={`
                                text-sm font-medium
                                ${isToday(day) ? 'bg-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center' : 'text-foreground'}
                              `}>
                                {day}
                              </span>
                              
                              {/* Conference indicators */}
                              <div className="mt-1 space-y-0.5">
                                {dayConferences.slice(0, 2).map((conf, i) => {
                                  const confIndex = monthConferences.findIndex(c => c.id === conf.id)
                                  const isStart = isConferenceStart(day, conf)
                                  const isEnd = isConferenceEnd(day, conf)
                                  
                                  return (
                                    <div
                                      key={conf.id}
                                      className={`
                                        text-[10px] md:text-xs text-white px-1 py-0.5 truncate
                                        ${getConferenceColor(confIndex)}
                                        ${isStart ? 'rounded-l-md' : ''}
                                        ${isEnd ? 'rounded-r-md' : ''}
                                        ${!isStart && !isEnd ? '' : ''}
                                      `}
                                      title={getConferenceName(conf)}
                                    >
                                      {isStart ? getConferenceName(conf).substring(0, 12) + (getConferenceName(conf).length > 12 ? '...' : '') : ''}
                                    </div>
                                  )
                                })}
                                {dayConferences.length > 2 && (
                                  <div className="text-[10px] text-muted-foreground">
                                    +{dayConferences.length - 2}
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </Card>

            {/* Sidebar - Upcoming Conferences */}
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                    {language === "ru" ? "Конференции" : language === "kk" ? "Конференциялар" : "Conferences"}
                  </h3>

                  {selectedConference ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                        <h4 className="font-bold text-foreground mb-2">{getConferenceName(selectedConference)}</h4>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4" />
                            {getConferenceDate(selectedConference)}
                          </div>
                          {selectedConference.time && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              {selectedConference.time}
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {selectedConference.location}
                          </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <Button asChild size="sm" className="flex-1">
                            <Link href={`/conferences/${selectedConference.id}/apply`}>
                              {t("apply_now")}
                            </Link>
                          </Button>
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/conferences/${selectedConference.id}`}>
                              {t("details")}
                            </Link>
                          </Button>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full"
                        onClick={() => setSelectedConference(null)}
                      >
                        {language === "ru" ? "Показать все" : language === "kk" ? "Барлығын көрсету" : "Show all"}
                      </Button>
                    </div>
                  ) : monthConferences.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-4">
                      {language === "ru" ? "Нет конференций в этом месяце" : 
                       language === "kk" ? "Бұл айда конференция жоқ" : 
                       "No conferences this month"}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {monthConferences.map((conf, index) => (
                        <div
                          key={conf.id}
                          className="p-3 rounded-lg border border-border/60 hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer"
                          onClick={() => setSelectedConference(conf)}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${getConferenceColor(index)}`} />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground text-sm truncate">{getConferenceName(conf)}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{getConferenceDate(conf)}</p>
                              <p className="text-xs text-muted-foreground truncate">{conf.location}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Legend */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm mb-3">
                    {language === "ru" ? "Обозначения" : language === "kk" ? "Белгілер" : "Legend"}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                        {today.getDate()}
                      </div>
                      <span className="text-muted-foreground">
                        {language === "ru" ? "Сегодня" : language === "kk" ? "Бүгін" : "Today"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-7 h-4 bg-primary rounded" />
                      <span className="text-muted-foreground">
                        {language === "ru" ? "Конференция" : language === "kk" ? "Конференция" : "Conference"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
