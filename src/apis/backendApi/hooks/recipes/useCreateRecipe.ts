import { useMutation, useQueryClient } from '@tanstack/react-query'

import { backendClient } from '@/src/apis/backendApi/client'
import type { RecipeDTO } from '@/src/apis/backendApi/dto/recipes/recipe.dto'
import {
  recipeDTOtoRecipe,
  recipeToCreateDTO,
} from '@/src/apis/backendApi/mappers/recipes/recipe.mapper'
import type { Recipe } from '@/src/models/recipe/recipe.model'

async function fetchCreateRecipe(recipe: Omit<Recipe, 'id'>): Promise<Recipe> {
  const { data } = await backendClient.post<RecipeDTO>('/api/recipes', recipeToCreateDTO(recipe))
  return recipeDTOtoRecipe(data)
}

export function useCreateRecipe() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fetchCreateRecipe,
    onSuccess: (created) => {
      queryClient.setQueryData<Recipe[]>(['recipes'], (prev) => [created, ...(prev ?? [])])
    },
  })
}
