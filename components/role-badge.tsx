"use client"

import { useLanguage } from "@/contexts/language-context"
import { getRoleBadgeColor, regions, type UserRole } from "@/lib/roles"
import { Badge } from "@/components/ui/badge"

interface RoleBadgeProps {
  role: UserRole
  region?: number | null
}

export function RoleBadge({ role, region }: RoleBadgeProps) {
  const { t, language } = useLanguage()

  const getRoleText = () => {
    let roleText = t(role as any)
    if (region && (role === "general_secretary" || role === "deputy")) {
      const regionName = regions[region as keyof typeof regions]?.[language]
      if (regionName) {
        roleText += ` (${regionName})`
      }
    }
    return roleText
  }

  return <Badge className={`${getRoleBadgeColor(role)} font-semibold`}>{getRoleText()}</Badge>
}
