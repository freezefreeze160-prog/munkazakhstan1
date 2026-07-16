"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useLanguage } from "@/contexts/language-context"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Notification {
  id: string
  type: string
  title: string
  body: string | null
  data: Record<string, string> | null
  read_at: string | null
  created_at: string
}

export function NotificationBell() {
  const supabase = createClient()
  const { t } = useLanguage()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.read_at).length

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  // Load user and initial notifications
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20)

      if (data) setNotifications(data)
    }
    init()
  }, [])

  // Realtime subscription
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel("notifications:" + userId)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev].slice(0, 20))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  async function markAllRead() {
    if (!userId) return
    const now = new Date().toISOString()
    await supabase
      .from("notifications")
      .update({ read_at: now })
      .eq("user_id", userId)
      .is("read_at", null)

    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? now })))
  }

  async function markRead(id: string) {
    const now = new Date().toISOString()
    await supabase.from("notifications").update({ read_at: now }).eq("id", id)
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read_at: now } : n))
  }

  function formatTime(iso: string) {
    const d = new Date(iso)
    const now = new Date()
    const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000)
    if (diffMin < 1) return t("just_now") || "только что"
    if (diffMin < 60) return `${diffMin} мин`
    if (diffMin < 1440) return `${Math.floor(diffMin / 60)} ч`
    return d.toLocaleDateString()
  }

  if (!userId) return null

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="relative p-2"
        onClick={() => setOpen((v) => !v)}
        aria-label="Уведомления"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-background border border-border rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="font-semibold text-sm">{t("notifications") || "Уведомления"}</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-primary hover:underline"
              >
                {t("mark_all_read") || "Прочитать все"}
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-border">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                {t("no_notifications") || "Уведомлений нет"}
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                    !n.read_at ? "bg-primary/5 border-l-2 border-l-primary" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm leading-snug ${!n.read_at ? "font-semibold" : "font-medium"}`}>
                      {n.title}
                    </p>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap mt-0.5">
                      {formatTime(n.created_at)}
                    </span>
                  </div>
                  {n.body && (
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{n.body}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
