// Award types, their weights, and the delegate level system.
// Level is derived from a score = (conferences attended) + (weighted awards).

export type AwardType =
  | "participation"
  | "honorable_mention"
  | "outstanding_delegate"
  | "best_delegate"
  | "best_position_paper"

export const AWARD_TYPES: AwardType[] = [
  "best_delegate",
  "outstanding_delegate",
  "honorable_mention",
  "best_position_paper",
  "participation",
]

// Weight each award adds to a delegate's score.
export const AWARD_WEIGHTS: Record<AwardType, number> = {
  best_delegate: 3,
  outstanding_delegate: 2,
  best_position_paper: 2,
  honorable_mention: 1,
  participation: 0,
}

export type DelegateLevel = "bronze" | "silver" | "gold"

// Compute a delegate score from conferences attended and their awards.
export function computeScore(conferencesCount: number, awards: AwardType[]): number {
  const awardPoints = awards.reduce((sum, a) => sum + (AWARD_WEIGHTS[a] ?? 0), 0)
  return conferencesCount + awardPoints
}

// Determine level from the combined score.
export function levelFromScore(score: number): DelegateLevel {
  if (score >= 6) return "gold"
  if (score >= 3) return "silver"
  return "bronze"
}

// Translation key for an award type label.
export function awardLabelKey(type: AwardType): string {
  return `award_${type}`
}
