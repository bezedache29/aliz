export interface NutritionalGoals {
  bmr: number
  tdeeBase: number
  dailyKcalBase: number
  dailyKcalAdjusted: number
  macros: {
    proteines: number
    glucides: number
    lipides: number
  }
  estimatedWeeks: number
}
