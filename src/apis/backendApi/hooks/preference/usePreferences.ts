import { useQuery } from '@tanstack/react-query'

import { backendClient } from '@/src/apis/backendApi/client'
import type { PreferencesResponseDTO } from '@/src/apis/backendApi/dto/preference/preference.dto'
import { foodPreferencesToModel } from '@/src/apis/backendApi/mappers/preference/preference.mapper'
import type { FoodPreferences } from '@/src/models/preference/food-preference.model'

async function fetchPreferences(): Promise<FoodPreferences> {
  const { data } = await backendClient.get<PreferencesResponseDTO>('/api/preferences')
  return foodPreferencesToModel(data)
}

export function usePreferences() {
  return useQuery({
    queryKey: ['preferences'],
    queryFn: fetchPreferences,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}
