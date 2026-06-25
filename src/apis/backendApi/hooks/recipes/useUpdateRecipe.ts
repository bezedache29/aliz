import { useMutation, useQueryClient } from '@tanstack/react-query'

import { backendClient } from '@/src/apis/backendApi/client'
import type { RecipeDTO } from '@/src/apis/backendApi/dto/recipes/recipe.dto'
import {
  recipeDTOtoRecipe,
  recipeToUpdateDTO,
} from '@/src/apis/backendApi/mappers/recipes/recipe.mapper'
import type { Recipe } from '@/src/models/recipe/recipe.model'

async function fetchUpdateRecipe(recipe: Recipe): Promise<Recipe> {
  if (!process.env.EXPO_PUBLIC_API_URL) {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return recipe
  }

  const { data } = await backendClient.put<RecipeDTO>(
    `/api/recipes/${recipe.id}`,
    recipeToUpdateDTO(recipe),
  )
  return recipeDTOtoRecipe(data)
}

export function useUpdateRecipe() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fetchUpdateRecipe,
    onSuccess: (updated) => {
      queryClient.setQueryData<Recipe[]>(['recipes'], (prev) => {
        if (!prev) return [updated]
        return prev.map((r) => (r.id === updated.id ? updated : r))
      })
    },
  })
}
