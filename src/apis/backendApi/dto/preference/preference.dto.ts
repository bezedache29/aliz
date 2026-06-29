export type PreferenceTypeDTO = 'liked' | 'disliked'

export interface FoodPreferenceDTO {
  id: string
  foodName: string
  type: PreferenceTypeDTO
}

export interface PreferencesResponseDTO {
  liked: FoodPreferenceDTO[]
  disliked: FoodPreferenceDTO[]
}

export interface CreatePreferenceDTO {
  foodName: string
  type: PreferenceTypeDTO
}

export interface CreatePreferenceResponseDTO {
  data: FoodPreferenceDTO
}
