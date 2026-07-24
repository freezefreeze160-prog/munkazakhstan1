// Presidium / secretariat positions a user can apply for in a conference.
export const PRESIDIUM_POSITIONS = [
  "chair",
  "co_chair",
  "secretary_general",
  "deputy_secretary_general",
  "under_secretary_general",
  "expert",
  "admin_staff",
  "media",
  "other",
] as const

export type PresidiumPosition = (typeof PRESIDIUM_POSITIONS)[number]

export function presidiumPositionKey(position: string): string {
  return `presidium_pos_${position}`
}
