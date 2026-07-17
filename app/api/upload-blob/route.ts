import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Generic authenticated file upload to Vercel Blob.
// Used for payment receipts, gallery photos, and certificate templates.
const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "application/pdf",
]
const ALLOWED_EXT = ["png", "jpg", "jpeg", "webp", "gif", "pdf"]
const MAX_SIZE = 15 * 1024 * 1024 // 15MB

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const folder = ((formData.get("folder") as string) || "uploads").replace(/[^a-zA-Z0-9_-]/g, "")

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || ""
    if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXT.includes(ext)) {
      return NextResponse.json({ error: "File must be an image or PDF" }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File size must be less than 15MB" }, { status: 400 })
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")
    const filename = `${folder}/${user.id}-${Date.now()}-${safeName}`
    const blob = await put(filename, file, {
      access: "public",
      contentType: file.type || "application/octet-stream",
    })

    return NextResponse.json({
      url: blob.url,
      name: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error("Blob upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
