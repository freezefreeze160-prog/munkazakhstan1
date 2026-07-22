import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config"

// Singleton instance to prevent "Multiple GoTrueClient instances" warning
let client: SupabaseClient | null = null

export function createClient() {
  if (client) return client

  client = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // Supabase-js normally guards token refresh with navigator.locks. After a
      // long idle period that lock can dead-lock, so getUser()/queries hang
      // forever and the page shows an infinite "Loading". Use a pass-through
      // lock (just run the callback) to avoid the dead-lock entirely.
      lock: async (_name, _acquireTimeout, fn) => fn(),
    },
  })

  return client
}

export { createClient as createBrowserClient }
