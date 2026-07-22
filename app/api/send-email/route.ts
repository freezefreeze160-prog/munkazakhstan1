import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Sends a transactional email via Resend.
// Safe no-op when RESEND_API_KEY is not configured, so nothing breaks
// before email is set up. Add RESEND_API_KEY (and optionally EMAIL_FROM,
// e.g. "MUN Kazakhstan <noreply@yourdomain.com>") in the project env to
// enable real delivery.
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      // Email not configured yet — succeed silently so callers don't fail.
      return NextResponse.json({ skipped: true, reason: "email_not_configured" })
    }

    const { to, subject, html } = (await request.json()) as {
      to?: string
      subject?: string
      html?: string
    }
    if (!to || !subject || !html) {
      return NextResponse.json({ error: "Missing to/subject/html" }, { status: 400 })
    }

    const from = process.env.EMAIL_FROM || "MUN Kazakhstan <onboarding@resend.dev>"

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    })

    if (!res.ok) {
      const detail = await res.text()
      console.error("Resend error:", detail)
      return NextResponse.json({ error: "Email send failed", detail }, { status: 502 })
    }

    return NextResponse.json({ sent: true })
  } catch (error) {
    console.error("send-email error:", error)
    return NextResponse.json({ error: "Email send failed" }, { status: 500 })
  }
}
