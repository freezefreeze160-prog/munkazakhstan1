import { put, del } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 })
    }

    // Get current profile to delete old photo if exists
    const { data: profile } = await supabase.from("profiles").select("photo_url").eq("user_id", user.id).maybeSingle()

    // Delete old photo if exists
    if (profile?.photo_url) {
      try {
        await del(profile.photo_url)
      } catch (error) {
        console.error("Error deleting old photo:", error)
      }
    }

    // Upload new photo to Vercel Blob
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
    const filename = `profile-${user.id}-${Date.now()}.${ext}`
    const blob = await put(filename, file, {
      access: "public",
      contentType: file.type,
    })

    // Update profile with new photo URL
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ photo_url: blob.url })
      .eq("user_id", user.id)

    if (updateError) {
      // If update fails, delete the uploaded blob
      await del(blob.url)
      throw updateError
    }

    return NextResponse.json({
      url: blob.url,
      filename: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
