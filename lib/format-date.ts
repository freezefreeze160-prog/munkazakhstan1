// Conference dates are stored as ISO strings ("YYYY-MM-DD") in date_ru/kk/en.
// Format them for display WITHOUT `new Date()` — parsing an ISO date string
// as UTC and rendering in a local timezone can shift the day (off-by-one).
export function formatConfDate(value?: string | null): string {
  if (!value) return ""
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!m) return value // already human-formatted (legacy free-text dates)
  const [, y, mo, d] = m
  return `${d}.${mo}.${y}`
}
