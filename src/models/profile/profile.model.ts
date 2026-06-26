import type { ActivityLevel } from '@/src/models/user/user.model'

export interface Profile {
  id: string
  firstName: string
  age: number
  gender: 'male' | 'female'
  heightCm: number
  currentWeightKg: number
  targetWeightKg: number
  activityLevel: ActivityLevel
  weightLossRateKg: 0.25 | 0.5 | 0.75 | 1.0
}

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sédentaire',
  light: 'Légèrement actif',
  moderate: 'Modérément actif',
  active: 'Très actif',
  very_active: 'Extrêmement actif',
}

export function computeBmi(weightKg: number, heightCm: number): number {
  const h = heightCm / 100
  return Math.round((weightKg / (h * h)) * 10) / 10
}

export type BmiCategory = 'underweight' | 'normal' | 'overweight' | 'obese'

export function getBmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) return 'underweight'
  if (bmi < 25) return 'normal'
  if (bmi < 30) return 'overweight'
  return 'obese'
}

export const BMI_LABELS: Record<BmiCategory, string> = {
  underweight: 'Maigreur',
  normal: 'Normal',
  overweight: 'Surpoids',
  obese: 'Obésité',
}
