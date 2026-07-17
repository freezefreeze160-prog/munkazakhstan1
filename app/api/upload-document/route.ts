import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const BUCKET = "uploads"
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]
const ALLOWED_EXT = ["pdf", "doc", "docx"]
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
    const conferenceId = formData.get("conference_id") as string
    const docType = formData.get("doc_type") as string
    const title = (formData.get("title") as string) || ""
    const committeeId = (formData.get("committee_id") as string) || null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }
    if (!conferenceId || !docType) {
      return NextResponse.json({ error: "Missing conference_id or doc_type" }, { status: 400 })
    }
    if (docType !== "background_guide" && docType !== "position_paper") {
      return NextResponse.json({ error: "Invalid doc_type" }, { status: 400 })
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || ""
    if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXT.includes(ext)) {
      return NextResponse.json({ error: "File must be a PDF or Word document" }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File size must be less than 15MB" }, { status: 400 })
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")
    const path = `documents/${conferenceId}/${docType}-${user.id}-${Date.now()}-${safeName}`

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

    // Insert record. RLS enforces permission (background guides only for organizers).
    const { data: inserted, error: insertError } = await supabase
      .from("conference_documents")
      .insert({
        conference_id: conferenceId,
        uploaded_by: user.id,
        doc_type: docType,
        title: title || file.name,
        file_url: publicUrl,
        file_name: file.name,
        file_size: file.size,
        committee_id: committeeId || null,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 403 })
    }

    return NextResponse.json({ document: inserted })
  } catch (error) {
    console.error("Document upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
