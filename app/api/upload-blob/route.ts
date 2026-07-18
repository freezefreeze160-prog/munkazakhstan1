import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Generic authenticated file upload to Supabase Storage.
// Used for payment receipts, gallery photos, and certificate templates.
const BUCKET = "uploads"
// Accept any image (incl. iPhone HEIC/HEIF) plus PDF.
const ALLOWED_EXT = ["png", "jpg", "jpeg", "webp", "gif", "heic", "heif", "jfif", "bmp", "avif", "pdf"]
const MAX_SIZE = 15 * 1024 * 1024 // 15MB

function isAllowed(file: File): boolean {
  const type = (file.type || "").toLowerCase()
  if (type.startsWith("image/")) return true
  if (type === "application/pdf") return true
  const ext = file.name.split(".").pop()?.toLowerCase() || ""
  return ALLOWED_EXT.includes(ext)
}

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

    if (!isAllowed(file)) {
      return NextResponse.json({ error: "File must be an image or PDF" }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File size must be less than 15MB" }, { status: 400 })
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")
    const path = `${folder}/${user.id}-${Date.now()}-${safeName}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type || "application/octet-stream", upsert: true })

    if (uploadError) {
      console.error("Storage upload error:", uploadError)
      return NextResponse.json({ error: "Upload failed" }, { status: 500 })
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(path)

    return NextResponse.json({ url: publicUrl, name: file.name, size: file.size, type: file.type })
  } catch (error) {
    console.error("Blob upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
