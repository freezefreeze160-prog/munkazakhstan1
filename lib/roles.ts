export type UserRole = "founder" | "admin" | "general_secretary" | "deputy" | "participant"

export interface UserProfile {
  id: string
  user_id: string
  full_name: string
  email?: string
  phone?: string
  bio?: string
  photo_url?: string
  role: UserRole
  region?: number
  supervisor_id?: string | null
  is_team_member?: boolean
  team_role?: string | null
  created_at: string
  updated_at: string
}

export const regions = {
  1: { ru: "Алматы", kk: "Алматы", en: "Almaty" },
  2: { ru: "Астана", kk: "Астана", en: "Astana" },
  3: { ru: "Шымкент", kk: "Шымкент", en: "Shymkent" },
  18: { ru: "Семей", kk: "Семей", en: "Semey" },
  19: { ru: "Кокшетау", kk: "Көкшетау", en: "Kokshetau" },
  20: { ru: "Талдыкорган", kk: "Талдықорған", en: "Taldykorgan" },
  21: { ru: "Уральск", kk: "Орал", en: "Uralsk" },
  22: { ru: "Усть-Каменогорск", kk: "Өскемен", en: "Ust-Kamenogorsk" },
  23: { ru: "Актобе", kk: "Ақтөбе", en: "Aktobe" },
  24: { ru: "Караганда", kk: "Қарағанды", en: "Karaganda" },
  25: { ru: "Тараз", kk: "Тараз", en: "Taraz" },
  26: { ru: "Кызылорда", kk: "Қызылорда", en: "Kyzylorda" },
  27: { ru: "Павлодар", kk: "Павлодар", en: "Pavlodar" },
  28: { ru: "Атырау", kk: "Атырау", en: "Atyrau" },
  29: { ru: "Костанай", kk: "Қостанай", en: "Kostanay" },
  30: { ru: "Петропавловск", kk: "Петропавл", en: "Petropavlovsk" },
  31: { ru: "Актау", kk: "Ақтау", en: "Aktau" },
  32: { ru: "Туркестан", kk: "Түркістан", en: "Turkestan" },
} as const

export const REGIONS = regions


export function getRoleBadgeColor(role: UserRole): string {
  switch (role) {
    case "founder":
      return "bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
    case "admin":
      return "bg-gradient-to-r from-purple-600 to-purple-700 text-white"
    case "general_secretary":
      return "bg-gradient-to-r from-blue-600 to-blue-700 text-white"
    case "deputy":
      return "bg-gradient-to-r from-green-600 to-green-700 text-white"
    default:
      return "bg-gray-200 text-gray-700"
  }
}

export function getRoleLabel(role: UserRole, language: "ru" | "kk" | "en"): string {
  const labels = {
    founder: { ru: "Основатель", kk: "Негізін қалаушы", en: "Founder" },
    admin: { ru: "Администратор", kk: "Администратор", en: "Administrator" },
    general_secretary: { ru: "Генеральный секретарь", kk: "Бас хатшы", en: "General Secretary" },
    deputy: { ru: "Заместитель", kk: "Орынбасар", en: "Deputy Secretary" },
    participant: { ru: "Участник", kk: "Қатысушы", en: "Participant" },
  }
  return labels[role][language]
}


export function canCreateNews(role: UserRole): boolean {
  return role === "founder"
}

export function canCreateConference(role: UserRole): boolean {
  // Only General Secretary and Founder can create conferences
  // Deputies are auto-assigned by their supervisors
  return role === "founder" || role === "general_secretary"
}

export function canApproveConference(role: UserRole): boolean {
  return role === "founder" || role === "admin"
}

export function canPublishConference(role: UserRole): boolean {
  return role === "founder" || role === "admin"
}

export function canAssignDeputy(role: UserRole): boolean {
  // Only General Secretary can assign deputies
  return role === "general_secretary"
}

export function canManageAllUsers(role: UserRole): boolean {
  // Only Founder can manage all users (Admin Panel access)
  return role === "founder"
}

export function canManageConference(role: UserRole, conferenceCreatorId: string, currentUserId: string, assignedDeputyId?: string | null): boolean {
  // Founder can manage any conference
  if (role === "founder") return true
  
  // Creator (General Secretary) can manage their own conference
  if (conferenceCreatorId === currentUserId) return true
  
  // Assigned Deputy can manage the conference
  if (assignedDeputyId && assignedDeputyId === currentUserId) return true
  
  return false
}

export function needsSupervisor(role: UserRole): boolean {
  // Deputies must have a supervisor (General Secretary)
  return role === "deputy"
}
