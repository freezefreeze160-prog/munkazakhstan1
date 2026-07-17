import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config"

// Singleton instance to prevent "Multiple GoTrueClient instances" warning
let client: SupabaseClient | null = null

export function createClient() {
  if (client) return client

  client = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  return client
}

export { createClient as createBrowserClient }
