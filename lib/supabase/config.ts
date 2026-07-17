// Supabase connection config.
//
// Prefers environment variables (NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY) when set,
// and falls back to the project's public values so the app keeps working even if
// the deployment environment has not configured them yet.
//
// NOTE: the anon (publishable) key is designed to be exposed in the browser — it
// is already shipped in the client bundle — so hardcoding it here as a fallback
// is safe. Row Level Security in the database is what protects the data.
const FALLBACK_SUPABASE_URL = "https://vodtmdduljajlgybzxep.supabase.co"
const FALLBACK_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvZHRtZGR1bGphamxneWJ6eGVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NDk4MDksImV4cCI6MjA3NTMyNTgwOX0.eIm4LxJGDGZQhQwWNrPtkOiSfnhT6mGKzITznJa9zvY"

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY
