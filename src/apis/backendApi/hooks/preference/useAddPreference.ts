import { useMutation, useQueryClient } from '@tanstack/react-query'

import { backendClient } from '@/src/apis/backendApi/client'
import type { CreatePreferenceResponseDTO } from '@/src/apis/backendApi/dto/preference/preference.dto'
import {
  createPreferenceToDTO,
  foodPreferenceDTOtoFoodPreference,
} from '@/src/apis/backendApi/mappers/preference/preference.mapper'
import type {
  FoodPreference,
  FoodPreferences,
  PreferenceType,
} from '@/src/models/preference/food-preference.model'

interface AddPreferenceInput {
  foodName: string
  type: PreferenceType
}

async function fetchAddPreference(input: AddPreferenceInput): Promise<FoodPreference> {
  const { data } = await backendClient.post<CreatePreferenceResponseDTO>(
    '/api/preferences',
    createPreferenceToDTO(input.foodName, input.type),
  )
  return foodPreferenceDTOtoFoodPreference(data.data)
}

export function useAddPreference() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fetchAddPreference,
    onSuccess: (created) => {
      queryClient.setQueryData<FoodPreferences>(['preferences'], (prev) => {
        const current = prev ?? { liked: [], disliked: [] }
        const isLiked = created.type === 'liked'
        const liked = isLiked
          ? [...current.liked.filter((p) => p.foodName !== created.foodName), created]
          : current.liked.filter((p) => p.foodName !== created.foodName)
        const disliked = !isLiked
          ? [...current.disliked.filter((p) => p.foodName !== created.foodName), created]
          : current.disliked.filter((p) => p.foodName !== created.foodName)
        return { liked, disliked }
      })
    },
  })
}
