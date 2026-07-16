"use server"

import { createClient } from "@/lib/supabase/server"

export async function submitApplication(formData: FormData) {
  console.log("[v0] Starting registration process")

  const conference = formData.get("conference") as string
  const fullname = formData.get("fullname") as string
  const school = formData.get("school") as string
  const email = formData.get("email") as string
  const grade = formData.get("grade") as string
  const motivation = formData.get("motivation") as string

  console.log("[v0] Form data received:", { conference, fullname, school, email, grade })

  if (!conference || !fullname || !school || !email || !grade) {
    console.log("[v0] Validation failed: missing required fields")
    return { success: false, error: "All required fields must be filled" }
  }

  const gradeNum = Number.parseInt(grade)
  if (isNaN(gradeNum) || gradeNum < 8 || gradeNum > 12) {
    console.log("[v0] Validation failed: invalid grade")
    return { success: false, error: "Grade must be between 8 and 12" }
  }

  try {
    const supabase = await createClient()
    console.log("[v0] Supabase client created")

    const {
      data: { user },
    } = await supabase.auth.getUser()
    console.log("[v0] Current user:", user?.id || "not authenticated")

    const { data, error } = await supabase
      .from("registrations")
      .insert({
        conference: conference,
        full_name: fullname,
        school: school,
        email: email,
        grade: gradeNum,
        motivation: motivation || null,
        user_id: user?.id || null,
      })
      .select()

    if (error) {
      console.error("[v0] Database error:", error)
      return { success: false, error: "Failed to save registration. Please try again." }
    }

    console.log("[v0] Registration saved successfully:", data)
    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error:", error)
    return { success: false, error: "An unexpected error occurred. Please try again." }
  }
}
