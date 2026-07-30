import type { MetadataRoute } from "next"
import { createClient } from "@supabase/supabase-js"
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/config"

const BASE = "https://munkazakhstan.com"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    "",
    "/about",
    "/conferences",
    "/register",
    "/map",
    "/calendar",
    "/hall-of-fame",
    "/resources",
    "/news",
    "/secretariat",
    "/search",
  ]
  const staticRoutes: MetadataRoute.Sitemap = staticPaths.map((p) => ({
    url: `${BASE}${p}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: p === "" ? 1 : 0.7,
  }))

  let conferenceRoutes: MetadataRoute.Sitemap = []
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    const { data } = await supabase
      .from("user_conferences")
      .select("id, updated_at, created_at")
      .eq("status", "published")
    conferenceRoutes = (data || []).map((c: { id: string; updated_at: string | null; created_at: string | null }) => ({
      url: `${BASE}/conferences/${c.id}`,
      lastModified: new Date(c.updated_at || c.created_at || Date.now()),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }))
  } catch {
    // If the DB is unreachable at build/request time, still return static routes
  }

  return [...staticRoutes, ...conferenceRoutes]
}
