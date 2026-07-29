import { cleanup, fireEvent, render } from '@testing-library/react-native'
import React from 'react'

import RecipeDetailScreen from '@/src/screens/recipes/RecipeDetailScreen'
import type { Recipe } from '@/src/models/recipe/recipe.model'

let mockParams: { ids: string; courses?: string }
const mockRouterPush = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
  useLocalSearchParams: () => mockParams,
}))

let mockRecipes: Recipe[] = []

jest.mock('@/src/apis/backendApi/hooks/recipes/useRecipes', () => ({
  useRecipes: () => ({ data: mockRecipes }),
}))

const recipeA: Recipe = {
  id: 'r-1',
  name: 'Curry de légumes',
  category: 'Plat principal',
  ingredients: [
    {
      food: {
        id: 'f-1',
        name: 'Riz',
        source: 'manual',
        per100g: { kcal: 130, proteines: 2.7, glucides: 28, lipides: 0.3 },
      },
      quantityG: 150,
    },
  ],
  steps: ['Cuire le riz', 'Ajouter le curry'],
  isFavorite: false,
}

const recipeB: Recipe = {
  id: 'r-2',
  name: 'Tarte aux pommes',
  category: 'Dessert',
  ingredients: [],
  steps: [],
  isFavorite: false,
}

afterEach(() => {
  cleanup()
  jest.clearAllMocks()
  mockRecipes = []
})

describe('RecipeDetailScreen', () => {
  it('affiche un message si aucune recette ne correspond', async () => {
    mockParams = { ids: 'unknown-id' }
    mockRecipes = [recipeA]
    const { getByText } = await render(<RecipeDetailScreen />)
    expect(getByText('Recette introuvable.')).toBeTruthy()
  })

  it('affiche le détail pour une seule recette', async () => {
    mockParams = { ids: 'r-1' }
    mockRecipes = [recipeA]
    const { getByText } = await render(<RecipeDetailScreen />)
    expect(getByText('Curry de légumes')).toBeTruthy()
    expect(getByText('Cuire le riz')).toBeTruthy()
  })

  it('affiche un menu avec plusieurs recettes et leurs plats', async () => {
    mockParams = { ids: 'r-1,r-2', courses: 'Plat,Dessert' }
    mockRecipes = [recipeA, recipeB]
    const { getByText } = await render(<RecipeDetailScreen />)
    expect(getByText('Menu')).toBeTruthy()
    expect(getByText('2 plats')).toBeTruthy()
    expect(getByText('Plat')).toBeTruthy()
    expect(getByText('Dessert')).toBeTruthy()
  })

  it("navigue vers l'édition de la recette", async () => {
    mockParams = { ids: 'r-1' }
    mockRecipes = [recipeA]
    const { getByText } = await render(<RecipeDetailScreen />)
    fireEvent.press(getByText('Modifier la recette'))
    expect(mockRouterPush).toHaveBeenCalledWith('/recipe-edit?id=r-1')
  })
})
