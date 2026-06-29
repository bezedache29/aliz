import type {
  CreatePreferenceDTO,
  FoodPreferenceDTO,
  PreferencesResponseDTO,
} from '@/src/apis/backendApi/dto/preference/preference.dto'
import type {
  FoodPreference,
  FoodPreferences,
  PreferenceType,
} from '@/src/models/preference/food-preference.model'

export function foodPreferenceDTOtoFoodPreference(dto: FoodPreferenceDTO): FoodPreference {
  return {
    id: dto.id,
    foodName: dto.foodName,
    type: dto.type as PreferenceType,
  }
}

export function foodPreferencesToModel(dto: PreferencesResponseDTO): FoodPreferences {
  return {
    liked: dto.liked.map(foodPreferenceDTOtoFoodPreference),
    disliked: dto.disliked.map(foodPreferenceDTOtoFoodPreference),
  }
}

export function createPreferenceToDTO(foodName: string, type: PreferenceType): CreatePreferenceDTO {
  return { foodName, type }
}
