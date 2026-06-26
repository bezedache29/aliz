import { useMutation, useQueryClient } from '@tanstack/react-query'

import { backendClient } from '@/src/apis/backendApi/client'
import type { Recipe } from '@/src/models/recipe/recipe.model'

async function fetchDeleteRecipe(id: string): Promise<void> {
  await backendClient.delete(`/api/recipes/${id}`)
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fetchDeleteRecipe,
    onSuccess: (_, id) => {
      queryClient.setQueryData<Recipe[]>(['recipes'], (prev) =>
        prev ? prev.filter((r) => r.id !== id) : [],
      )
    },
  })
}
