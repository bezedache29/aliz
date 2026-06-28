import { useMutation, useQueryClient } from '@tanstack/react-query'

import { backendClient } from '@/src/apis/backendApi/client'
import type { RecipeDTO } from '@/src/apis/backendApi/dto/recipes/recipe.dto'
import {
  recipeDTOtoRecipe,
  recipeToUpdateDTO,
} from '@/src/apis/backendApi/mappers/recipes/recipe.mapper'
import type { Recipe } from '@/src/models/recipe/recipe.model'

async function fetchUpdateRecipe(recipe: Recipe): Promise<Recipe> {
  const { data } = await backendClient.put<{ data: RecipeDTO }>(
    `/api/recipes/${recipe.id}`,
    recipeToUpdateDTO(recipe),
  )
  return recipeDTOtoRecipe(data.data)
}

export function useUpdateRecipe() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fetchUpdateRecipe,
    onSuccess: (updated) => {
      queryClient.setQueryData<Recipe[]>(['recipes'], (prev) =>
        prev ? prev.map((r) => (r.id === updated.id ? updated : r)) : [updated],
      )
    },
  })
}
