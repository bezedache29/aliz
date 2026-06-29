import { useMutation, useQueryClient } from '@tanstack/react-query'

import { backendClient } from '@/src/apis/backendApi/client'
import type { FoodPreferences } from '@/src/models/preference/food-preference.model'

async function fetchDeletePreference(id: string): Promise<void> {
  await backendClient.delete(`/api/preferences/${id}`)
}

export function useDeletePreference() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fetchDeletePreference,
    onSuccess: (_, id) => {
      queryClient.setQueryData<FoodPreferences>(['preferences'], (prev) => {
        if (!prev) return { liked: [], disliked: [] }
        return {
          liked: prev.liked.filter((p) => p.id !== id),
          disliked: prev.disliked.filter((p) => p.id !== id),
        }
      })
    },
  })
}
