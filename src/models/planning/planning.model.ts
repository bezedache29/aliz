export type MealType = 'Petit-déjeuner' | 'Déjeuner' | 'Collation' | 'Dîner'

export interface PlannedMeal {
  id: string
  name: string
  kcal: number
  proteines: number
  glucides: number
  lipides: number
  meal: MealType
}
