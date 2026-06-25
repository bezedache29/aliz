import { useQuery } from '@tanstack/react-query'

import { backendClient } from '@/src/apis/backendApi/client'
import type { RecipesListResponseDTO } from '@/src/apis/backendApi/dto/recipes/recipe.dto'
import { recipeDTOtoRecipe } from '@/src/apis/backendApi/mappers/recipes/recipe.mapper'
import { MOCK_RECIPES } from '@/src/data/mockRecipes'
import type { Recipe } from '@/src/models/recipe/recipe.model'

async function fetchMockRecipes(): Promise<Recipe[]> {
  await new Promise((resolve) => setTimeout(resolve, 400))
  return MOCK_RECIPES
}

async function fetchRecipes(): Promise<Recipe[]> {
  if (!process.env.EXPO_PUBLIC_API_URL) {
    return fetchMockRecipes()
  }

  const { data } = await backendClient.get<RecipesListResponseDTO>('/api/recipes')
  return data.recipes.map(recipeDTOtoRecipe)
}

export function useRecipes() {
  return useQuery({
    queryKey: ['recipes'],
    queryFn: fetchRecipes,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}
