"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { UserRole } from "@/lib/roles"

const FOUNDER_EMAIL = process.env.FOUNDER_EMAIL ?? ""

export async function loginAction(email: string, password: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      return {
        success: false,
        error: error.message === "Invalid login credentials" ? "error_invalid_credentials" : "error_generic",
      }
    }
    revalidatePath("/", "layout")
    return { success: true, user: data.user }
  } catch (error) {
    return { success: false, error: "network_error" }
  }
}

export async function signUpAction(
  email: string,
  password: string,
  fullName: string,
  phone: string,
) {
  try {
    const supabase = await createClient()

    // Only founder email gets founder role, everyone else is participant
    const actualRole: UserRole = (FOUNDER_EMAIL && email === FOUNDER_EMAIL) ? "founder" : "participant"

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone,
          role: actualRole,
        },
      },
    })

    if (error) {
      if (error.message.includes("already registered") || error.message.includes("already been registered")) {
        return { success: false, error: "error_email_exists" }
      }
      // Ignore email-related errors (e.g. "email rate limit exceeded"): the
      // user is still created and auto-confirmed by the DB trigger, so we can
      // sign them in below. Only bail out on non-email errors.
      const msg = error.message.toLowerCase()
      const isEmailIssue = msg.includes("email") || msg.includes("rate limit") || msg.includes("confirm")
      if (!isEmailIssue) {
        return { success: false, error: "error_creating_account" }
      }
    }

    // Sign the user in right away (no email confirmation needed) so they land
    // on the site with a session.
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError || !signInData.user) {
      return { success: false, error: "error_creating_account" }
    }

    revalidatePath("/", "layout")
    return { success: true, user: signInData.user }
  } catch (error) {
    return { success: false, error: "error_generic" }
  }
}
