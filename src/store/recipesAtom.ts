import { MOCK_RECIPES } from '@/src/data/mockRecipes'
import { Recipe } from '@/src/models/recipe/recipe.model'

import { atomWithMMKV } from './atomWithMMKV'

export const recipesAtom = atomWithMMKV<Recipe[]>('recipes', MOCK_RECIPES)

export function addRecipe(prev: Recipe[], recipe: Recipe): Recipe[] {
  return [recipe, ...prev]
}

export function removeRecipe(prev: Recipe[], id: string): Recipe[] {
  return prev.filter((r) => r.id !== id)
}

export function toggleFavorite(prev: Recipe[], id: string): Recipe[] {
  return prev.map((r) => (r.id === id ? { ...r, isFavorite: !r.isFavorite } : r))
}

export function searchRecipes(recipes: Recipe[], query: string): Recipe[] {
  if (!query.trim()) return recipes
  const q = query.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  return recipes.filter((r) => {
    const name = r.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    return name.includes(q)
  })
}
