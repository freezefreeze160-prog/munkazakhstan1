import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import type { UserRole } from "@/lib/roles"

export interface ProtectedRequest extends NextRequest {
  user?: {
    id: string
    email: string
    role: UserRole
    school_id?: number
  }
}

/**
 * Middleware to check user authentication and role
 * Attaches user info to request for use in route handlers
 */
export async function authenticateUser(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) {
      return null
    }

    // Get user profile with role information
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, school_id")
      .eq("user_id", authUser.id)
      .single()

    return {
      id: authUser.id,
      email: authUser.email || "",
      role: (profile?.role as UserRole) || "participant",
      school_id: profile?.school_id,
    }
  } catch (error) {
    return null
  }
}

/**
 * Check if user has required role(s)
 */
export function hasRole(userRole: UserRole | undefined, requiredRoles: UserRole[]) {
  return userRole && requiredRoles.includes(userRole)
}

/**
 * Route handler protection decorator
 * Returns 401 if not authenticated, 403 if role not allowed
 */
export async function protectedRoute(
  request: NextRequest,
  handler: (req: NextRequest, user: any) => Promise<Response>,
  requiredRoles?: UserRole[],
) {
  const user = await authenticateUser(request)

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (requiredRoles && !hasRole(user.role, requiredRoles)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return handler(request, user)
}
