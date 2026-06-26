export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'

export const ACTIVITY_COEFFICIENTS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
}

export interface UserProfile {
  firstName: string
  age: number
  sex: 'male' | 'female'
  height: number
  activityLevel: ActivityLevel
  targetWeight: number
  baseKcal: number
}
