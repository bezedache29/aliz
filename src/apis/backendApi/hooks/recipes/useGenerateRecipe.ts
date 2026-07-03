import { useMutation } from '@tanstack/react-query'

import { backendClient } from '@/src/apis/backendApi/client'
import type {
  GenerateRecipeRequestDTO,
  GeneratedRecipeDTO,
} from '@/src/apis/backendApi/dto/recipes/generate-recipe.dto'
import { generatedRecipeDTOtoRecipe } from '@/src/apis/backendApi/mappers/recipes/generate-recipe.mapper'
import type { Recipe } from '@/src/models/recipe/recipe.model'

interface GenerateRecipeParams {
  prompt: string
  useStock: boolean
}

async function fetchGenerateRecipe(params: GenerateRecipeParams): Promise<Omit<Recipe, 'id'>> {
  const body: GenerateRecipeRequestDTO = {
    prompt: params.prompt,
    useStock: params.useStock,
    save: false,
  }
  const { data } = await backendClient.post<GeneratedRecipeDTO>('/api/recipes/generate', body)
  return generatedRecipeDTOtoRecipe(data)
}

export function useGenerateRecipe() {
  return useMutation({
    mutationFn: fetchGenerateRecipe,
  })
}
