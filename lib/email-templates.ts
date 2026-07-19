// Branded, responsive HTML email templates for MUN Kazakhstan.
// Kept i18n-agnostic: callers pass already-translated strings so the same
// builder works for ru / kk / en. Table-based layout + inline styles for
// broad email-client compatibility (Gmail, Outlook, Apple Mail, mail.ru).

const BRAND = "#2563eb"
const BRAND_DARK = "#1e40af"

interface StatusEmailParams {
  /** Delegate's full name (greeting). */
  delegateName?: string | null
  /** Conference name in the recipient's language. */
  conferenceName: string
  /** "approved" | "rejected" — drives the accent color & pill. */
  status: "approved" | "rejected"
  /** Translated heading, e.g. "Заявка одобрена ✅". */
  heading: string
  /** Translated body paragraph. */
  message: string
  /** Optional assigned committee (shown only when approved). */
  committee?: string | null
  /** Optional assigned country (shown only when approved). */
  country?: string | null
  /** Optional CTA button label + url (e.g. "Открыть конференцию"). */
  ctaLabel?: string
  ctaUrl?: string
  /** Localized labels for the info card. */
  committeeLabel?: string
  countryLabel?: string
  /** Localized footer tagline. */
  footerNote?: string
}

interface AnnouncementEmailParams {
  conferenceName: string
  subject: string
  /** Free-text body; newlines become paragraph breaks. */
  message: string
  ctaLabel?: string
  ctaUrl?: string
  footerNote?: string
}

function escapeHtml(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/**
 * Builds a branded announcement/broadcast email from an organizer to delegates.
 */
export function buildAnnouncementEmail(params: AnnouncementEmailParams): string {
  const {
    conferenceName,
    subject,
    message,
    ctaLabel,
    ctaUrl,
    footerNote = "Model United Nations Kazakhstan",
  } = params

  const paragraphs = message
    .split(/\n{2,}|\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(
      (p) =>
        `<p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;color:#334155;">${escapeHtml(p)}</p>`,
    )
    .join("")

  const ctaBlock =
    ctaLabel && ctaUrl
      ? `<tr><td align="center" style="padding:8px 32px 8px 32px;">
           <a href="${escapeHtml(ctaUrl)}" target="_blank" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:13px 28px;border-radius:10px;">${escapeHtml(ctaLabel)}</a>
         </td></tr>`
      : ""

  return `<!doctype html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"></head>
<body style="margin:0;padding:0;background:#eef2f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 6px 24px rgba(15,23,42,0.08);">
        <tr><td style="background:linear-gradient(135deg,${BRAND},${BRAND_DARK});padding:28px 32px;">
          <div style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:0.3px;">🇰🇿 MUN Kazakhstan</div>
        </td></tr>
        <tr><td style="padding:26px 32px 4px 32px;">
          <p style="margin:0 0 4px 0;font-size:12px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:${BRAND};">${escapeHtml(conferenceName)}</p>
          <h1 style="margin:0 0 14px 0;font-size:20px;line-height:1.35;color:#0f172a;">${escapeHtml(subject)}</h1>
          ${paragraphs}
        </td></tr>
        ${ctaBlock}
        <tr><td style="padding:22px 32px 28px 32px;">
          <hr style="border:none;border-top:1px solid #eef2f7;margin:0 0 16px 0;">
          <p style="margin:0;font-size:12px;line-height:1.5;color:#94a3b8;">${escapeHtml(footerNote)}<br><a href="https://munkazakhstan.com" style="color:${BRAND};text-decoration:none;">munkazakhstan.com</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

/**
 * Builds a full HTML document for an application-status email.
 */
export function buildStatusEmail(params: StatusEmailParams): string {
  const {
    delegateName,
    conferenceName,
    status,
    heading,
    message,
    committee,
    country,
    ctaLabel,
    ctaUrl,
    committeeLabel = "Committee",
    countryLabel = "Country",
    footerNote = "Model United Nations Kazakhstan",
  } = params

  const accent = status === "approved" ? "#16a34a" : "#dc2626"
  const accentSoft = status === "approved" ? "#dcfce7" : "#fee2e2"
  const emoji = status === "approved" ? "🎉" : "💬"

  const name = delegateName ? escapeHtml(delegateName) : ""
  const conf = escapeHtml(conferenceName)

  const infoCard =
    status === "approved" && (committee || country)
      ? `
      <tr>
        <td style="padding:0 32px 8px 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
            ${
              committee
                ? `<tr>
                    <td style="padding:14px 18px;font-size:13px;color:#64748b;">${escapeHtml(committeeLabel)}</td>
                    <td style="padding:14px 18px;font-size:14px;font-weight:600;color:#0f172a;text-align:right;">${escapeHtml(committee)}</td>
                  </tr>`
                : ""
            }
            ${
              country
                ? `<tr>
                    <td style="padding:14px 18px;font-size:13px;color:#64748b;border-top:1px solid #e2e8f0;">${escapeHtml(countryLabel)}</td>
                    <td style="padding:14px 18px;font-size:14px;font-weight:600;color:#0f172a;text-align:right;border-top:1px solid #e2e8f0;">${escapeHtml(country)}</td>
                  </tr>`
                : ""
            }
          </table>
        </td>
      </tr>`
      : ""

  const ctaBlock =
    ctaLabel && ctaUrl
      ? `
      <tr>
        <td align="center" style="padding:12px 32px 8px 32px;">
          <a href="${escapeHtml(ctaUrl)}" target="_blank"
             style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:13px 28px;border-radius:10px;">
            ${escapeHtml(ctaLabel)}
          </a>
        </td>
      </tr>`
      : ""

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light only">
</head>
<body style="margin:0;padding:0;background:#eef2f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 6px 24px rgba(15,23,42,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,${BRAND},${BRAND_DARK});padding:28px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:0.3px;">
                    🇰🇿 MUN Kazakhstan
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Status pill -->
          <tr>
            <td style="padding:28px 32px 4px 32px;">
              <span style="display:inline-block;background:${accentSoft};color:${accent};font-size:13px;font-weight:700;padding:6px 14px;border-radius:999px;">
                ${emoji}&nbsp;${escapeHtml(heading)}
              </span>
            </td>
          </tr>

          <!-- Greeting + message -->
          <tr>
            <td style="padding:16px 32px 6px 32px;">
              ${name ? `<p style="margin:0 0 12px 0;font-size:16px;color:#0f172a;font-weight:600;">${name},</p>` : ""}
              <p style="margin:0 0 8px 0;font-size:15px;line-height:1.6;color:#334155;">${escapeHtml(message)}</p>
              <p style="margin:8px 0 0 0;font-size:17px;line-height:1.5;color:${BRAND};font-weight:700;">${conf}</p>
            </td>
          </tr>

          ${infoCard}
          ${ctaBlock}

          <!-- Footer -->
          <tr>
            <td style="padding:22px 32px 28px 32px;">
              <hr style="border:none;border-top:1px solid #eef2f7;margin:0 0 16px 0;">
              <p style="margin:0;font-size:12px;line-height:1.5;color:#94a3b8;">
                ${escapeHtml(footerNote)}<br>
                <a href="https://munkazakhstan.com" style="color:${BRAND};text-decoration:none;">munkazakhstan.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
