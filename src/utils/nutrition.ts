import { type ActivityLevel, ACTIVITY_COEFFICIENTS } from '@/src/models/user/user.model'
import { type NutritionalGoals } from '@/src/models/nutrition/nutrition.model'

export function calculateBMR(
  weight: number,
  height: number,
  age: number,
  sex: 'male' | 'female',
): number {
  const base = 10 * weight + 6.25 * height - 5 * age
  return Math.round(sex === 'male' ? base + 5 : base - 161)
}

export function calculateNutritionalGoals(
  currentWeight: number,
  height: number,
  age: number,
  sex: 'male' | 'female',
  activityLevel: ActivityLevel,
  targetWeight: number,
  weeklyLossKg: 0.5 | 1 = 0.5,
): NutritionalGoals {
  const bmr = calculateBMR(currentWeight, height, age, sex)
  const tdeeBase = Math.round(bmr * ACTIVITY_COEFFICIENTS[activityLevel])

  const deficit = weeklyLossKg === 1 ? 1000 : 500
  const dailyKcalBase = Math.max(1500, tdeeBase - deficit)

  const weightToLose = currentWeight - targetWeight
  const deficitPerDay = tdeeBase - dailyKcalBase
  const estimatedWeeks =
    weightToLose > 0 && deficitPerDay > 0
      ? Math.round((weightToLose * 7700) / (deficitPerDay * 7))
      : 0

  // Protein: 2g/kg capped at 35% of calories to always leave room for carbs
  const proteines = Math.round(Math.min(currentWeight * 2, (dailyKcalBase * 0.35) / 4))
  // Fat: 25% of total calories
  const lipides = Math.round((dailyKcalBase * 0.25) / 9)
  const glucides = Math.max(0, Math.round((dailyKcalBase - proteines * 4 - lipides * 9) / 4))

  return {
    bmr,
    tdeeBase,
    dailyKcalBase,
    dailyKcalAdjusted: dailyKcalBase,
    macros: { proteines, glucides, lipides },
    estimatedWeeks,
  }
}
