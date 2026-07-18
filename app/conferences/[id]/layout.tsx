import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"

// Dynamic Open Graph / Twitter metadata so shared conference links show the
// poster, title and description in WhatsApp / Telegram / Instagram / etc.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data } = await supabase
      .from("user_conferences")
      .select("name_ru, name_en, description_ru, description_en, poster_url, location")
      .eq("id", id)
      .maybeSingle()

    if (!data) {
      return { title: "MUN Kazakhstan" }
    }

    const title = data.name_en || data.name_ru || "Conference"
    const description =
      (data.description_en || data.description_ru || data.location || "").slice(0, 180) ||
      "Model UN conference in Kazakhstan"
    const images = data.poster_url ? [{ url: data.poster_url }] : []

    return {
      title: `${title} — MUN Kazakhstan`,
      description,
      openGraph: {
        title,
        description,
        images,
        type: "website",
      },
      twitter: {
        card: data.poster_url ? "summary_large_image" : "summary",
        title,
        description,
        images: data.poster_url ? [data.poster_url] : [],
      },
    }
  } catch {
    return { title: "MUN Kazakhstan" }
  }
}

export default function ConferenceLayout({ children }: { children: React.ReactNode }) {
  return children
}
