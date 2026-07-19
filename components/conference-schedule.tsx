"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarClock, Plus, Trash2, Coffee, Users, Award } from "lucide-react"

interface ScheduleItem {
  id: string
  conference_id: string
  day_label: string | null
  start_time: string | null
  end_time: string | null
  title: string
  kind: string
  sort_order: number
  created_at: string
}

const KIND_ICON: Record<string, typeof Users> = {
  session: Users,
  break: Coffee,
  ceremony: Award,
}

export function ConferenceSchedule({
  conferenceId,
  isOrganizer,
}: {
  conferenceId: string
  isOrganizer: boolean
}) {
  const { t } = useLanguage()
  const supabase = createBrowserClient()
  const [items, setItems] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    day_label: "",
    start_time: "",
    end_time: "",
    title: "",
    kind: "session",
  })

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conferenceId])

  async function loadData() {
    try {
      setLoading(true)
      const { data } = await supabase
        .from("conference_schedule")
        .select("*")
        .eq("conference_id", conferenceId)
        .order("sort_order", { ascending: true })
        .order("start_time", { ascending: true })
      setItems(data || [])
    } catch (err) {
      console.error("Error loading schedule:", err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd() {
    if (!form.title.trim()) {
      alert(t("schedule_title_required"))
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase.from("conference_schedule").insert({
        conference_id: conferenceId,
        day_label: form.day_label.trim() || null,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        title: form.title.trim(),
        kind: form.kind,
        sort_order: items.length,
      })
      if (error) throw error
      setForm({ day_label: "", start_time: "", end_time: "", title: "", kind: "session" })
      setAdding(false)
      await loadData()
    } catch (err) {
      console.error("Error adding schedule item:", err)
      alert((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t("confirm_delete"))) return
    try {
      const { error } = await supabase.from("conference_schedule").delete().eq("id", id)
      if (error) throw error
      setItems((prev) => prev.filter((i) => i.id !== id))
    } catch (err) {
      console.error("Error deleting schedule item:", err)
      alert((err as Error).message)
    }
  }

  // Nothing to show and no way to add — hide the whole block
  if (!loading && items.length === 0 && !isOrganizer) return null

  // Group by day label (keeps insertion order of days)
  const groups: { label: string; items: ScheduleItem[] }[] = []
  for (const item of items) {
    const label = item.day_label?.trim() || t("schedule_day")
    let group = groups.find((g) => g.label === label)
    if (!group) {
      group = { label, items: [] }
      groups.push(group)
    }
    group.items.push(item)
  }

  return (
    <div className="border rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        <CalendarClock className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-lg">{t("schedule")}</h3>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground mb-3">{t("no_schedule")}</p>
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="text-sm font-semibold text-primary mb-2">{group.label}</p>
              <div className="space-y-1.5">
                {group.items.map((item) => {
                  const Icon = KIND_ICON[item.kind] || Users
                  const time =
                    item.start_time && item.end_time
                      ? `${item.start_time}–${item.end_time}`
                      : item.start_time || ""
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-background"
                    >
                      {time && (
                        <span className="text-sm font-mono text-muted-foreground w-24 flex-shrink-0 tabular-nums">
                          {time}
                        </span>
                      )}
                      <div
                        className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${
                          item.kind === "break"
                            ? "bg-amber-500/10 text-amber-600"
                            : item.kind === "ceremony"
                              ? "bg-yellow-500/10 text-yellow-600"
                              : "bg-primary/10 text-primary"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <p className="flex-1 min-w-0 text-sm font-medium text-foreground">{item.title}</p>
                      {isOrganizer && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {isOrganizer && (
        <div className="mt-4">
          {!adding ? (
            <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {t("add_schedule_item")}
            </Button>
          ) : (
            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1">
                  <Label className="text-xs">{t("schedule_day")}</Label>
                  <Input
                    placeholder={t("schedule_day_placeholder")}
                    value={form.day_label}
                    onChange={(e) => setForm({ ...form, day_label: e.target.value })}
                  />
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs">{t("schedule_type")}</Label>
                  <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="session">{t("schedule_kind_session")}</SelectItem>
                      <SelectItem value="break">{t("schedule_kind_break")}</SelectItem>
                      <SelectItem value="ceremony">{t("schedule_kind_ceremony")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1">
                  <Label className="text-xs">{t("schedule_start")}</Label>
                  <Input
                    type="time"
                    value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                  />
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs">{t("schedule_end")}</Label>
                  <Input
                    type="time"
                    value={form.end_time}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-1">
                <Label className="text-xs">{t("schedule_item_title")}</Label>
                <Input
                  placeholder={t("schedule_item_placeholder")}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAdd} disabled={saving} className="bg-primary hover:bg-primary/90">
                  {saving ? t("saving") : t("add")}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setAdding(false)}>
                  {t("cancel")}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
