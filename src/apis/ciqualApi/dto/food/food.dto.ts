export interface CiqualFoodDTO {
  id: string
  nom: string
  kcal: number
  proteines: number
  glucides: number
  lipides: number
  fibres?: number | null
  sel?: number | null
}
