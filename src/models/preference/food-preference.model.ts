export type PreferenceType = 'liked' | 'disliked'

export interface FoodPreference {
  id: string
  foodName: string
  type: PreferenceType
}

export interface FoodPreferences {
  liked: FoodPreference[]
  disliked: FoodPreference[]
}
