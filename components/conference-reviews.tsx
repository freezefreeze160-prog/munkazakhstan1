"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Star, MessageSquare } from "lucide-react"

interface Review {
  id: string
  user_id: string
  author_name: string | null
  rating: number
  comment: string | null
  created_at: string
}

function Stars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={onChange ? "cursor-pointer" : "cursor-default"}
          aria-label={`${n}`}
        >
          <Star
            className={`w-5 h-5 ${n <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"}`}
          />
        </button>
      ))}
    </div>
  )
}

export function ConferenceReviews({
  conferenceId,
  userId,
  authorName,
  canReview,
}: {
  conferenceId: string
  userId: string | null
  authorName?: string | null
  canReview: boolean
}) {
  const { t } = useLanguage()
  const supabase = createBrowserClient()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conferenceId])

  async function load() {
    try {
      setLoading(true)
      const { data } = await supabase
        .from("conference_reviews")
        .select("*")
        .eq("conference_id", conferenceId)
        .order("created_at", { ascending: false })
      const list = (data as Review[]) || []
      setReviews(list)
      const mine = list.find((r) => r.user_id === userId)
      if (mine) {
        setRating(mine.rating)
        setComment(mine.comment || "")
      }
    } catch (err) {
      console.error("Error loading reviews:", err)
    } finally {
      setLoading(false)
    }
  }

  async function submit() {
    if (!userId || rating < 1) {
      alert(t("review_pick_rating"))
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase.from("conference_reviews").upsert(
        {
          conference_id: conferenceId,
          user_id: userId,
          author_name: authorName || null,
          rating,
          comment: comment.trim() || null,
        },
        { onConflict: "user_id,conference_id" },
      )
      if (error) throw error
      await load()
      alert(t("review_saved"))
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const avg =
    reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0

  // Hide the whole block if there's nothing to show and the user can't review
  if (!loading && reviews.length === 0 && !canReview) return null

  return (
    <div className="border rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-lg">{t("reviews")}</h3>
        {reviews.length > 0 && (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            {avg.toFixed(1)} · {reviews.length}
          </span>
        )}
      </div>

      {canReview && userId && (
        <div className="mb-5 p-4 rounded-lg bg-muted/30 border">
          <p className="text-sm font-medium mb-2">{t("your_review")}</p>
          <Stars value={rating} onChange={setRating} />
          <Textarea
            className="mt-3"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t("review_placeholder")}
          />
          <Button size="sm" className="mt-3 bg-primary hover:bg-primary/90" onClick={submit} disabled={saving}>
            {saving ? t("saving") : t("submit")}
          </Button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("no_reviews")}</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="border-b last:border-0 pb-3 last:pb-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{r.author_name || t("delegate")}</span>
                <Stars value={r.rating} />
              </div>
              {r.comment && <p className="text-sm text-muted-foreground mt-1">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
