import { useMutation, useQueryClient } from '@tanstack/react-query'

import { backendClient } from '@/src/apis/backendApi/client'
import type { Recipe } from '@/src/models/recipe/recipe.model'

async function fetchDeleteRecipe(id: string): Promise<void> {
  if (!process.env.EXPO_PUBLIC_API_URL) {
    await new Promise((resolve) => setTimeout(resolve, 200))
    return
  }

  await backendClient.delete(`/api/recipes/${id}`)
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fetchDeleteRecipe,
    onSuccess: (_, id) => {
      queryClient.setQueryData<Recipe[]>(['recipes'], (prev) => {
        if (!prev) return []
        return prev.filter((r) => r.id !== id)
      })
    },
  })
}
