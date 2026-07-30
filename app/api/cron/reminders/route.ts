import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { SUPABASE_URL } from "@/lib/supabase/config"
import { buildAnnouncementEmail } from "@/lib/email-templates"

export const dynamic = "force-dynamic"

// Daily reminder job (configured via vercel.json crons).
// Emails approved delegates when their conference starts in ~3 days.
// Requires SUPABASE_SERVICE_ROLE_KEY (to read delegate emails), RESEND_API_KEY,
// and optionally CRON_SECRET (Vercel sends it as a Bearer token) + EMAIL_FROM.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get("authorization")
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const resendKey = process.env.RESEND_API_KEY
  if (!serviceKey || !resendKey) {
    return NextResponse.json({ skipped: true, reason: "not_configured" })
  }

  const supabase = createClient(SUPABASE_URL, serviceKey, {
    auth: { persistSession: false },
  })
  const from = process.env.EMAIL_FROM || "MUN Kazakhstan <noreply@munkazakhstan.com>"

  // Conferences starting in exactly 3 days
  const target = new Date()
  target.setDate(target.getDate() + 3)
  const targetIso = target.toISOString().slice(0, 10)

  const { data: confs } = await supabase
    .from("user_conferences")
    .select("id, name_ru, date_ru, location")
    .eq("status", "published")
    .eq("date_ru", targetIso)

  let sent = 0
  for (const conf of confs || []) {
    const { data: apps } = await supabase
      .from("delegate_applications")
      .select("email, full_name")
      .eq("conference_id", conf.id)
      .eq("status", "approved")

    for (const a of apps || []) {
      if (!a.email) continue
      const subject = `Напоминание: ${conf.name_ru} через 3 дня`
      const html = buildAnnouncementEmail({
        conferenceName: conf.name_ru,
        subject,
        message: `Здравствуйте! Напоминаем, что конференция «${conf.name_ru}» состоится ${conf.date_ru} в ${conf.location}. Готовьтесь и ждём вас!`,
        ctaLabel: "Открыть конференцию",
        ctaUrl: `https://munkazakhstan.com/conferences/${conf.id}`,
        footerNote: "Model United Nations Kazakhstan",
      })
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ from, to: a.email, subject, html }),
        })
        if (res.ok) sent++
      } catch {
        // ignore individual send failures
      }
    }
  }

  return NextResponse.json({ ok: true, conferences: confs?.length || 0, sent })
}
