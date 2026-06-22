export interface Recipe {
  id?: string
  name: string
  meal: 'Petit-déjeuner' | 'Déjeuner' | 'Dîner' | 'Collation'
  kcal: number
  proteines: number
  glucides: number
  lipides: number
  ingredients: string
  steps: string[]
  isFavorite?: boolean
}
