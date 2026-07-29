import { cleanup, fireEvent, render } from '@testing-library/react-native'
import React from 'react'

import RecipeGenerateScreen from '@/src/screens/recipes/RecipeGenerateScreen'
import type { Recipe } from '@/src/models/recipe/recipe.model'

let mockMealTypeParam: string | undefined
const mockRouterBack = jest.fn()
const mockCreateJournalEntry = jest.fn()
const mockUpdateStock = jest.fn()
const mockDeleteStock = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockRouterBack }),
  useLocalSearchParams: () => ({ mealType: mockMealTypeParam }),
}))

jest.mock('@/src/apis/backendApi/hooks/journal/useCreateJournalEntry', () => ({
  useCreateJournalEntry: () => ({ mutate: mockCreateJournalEntry }),
}))

let mockStockItems: any[] = []

jest.mock('@/src/apis/backendApi/hooks/stock/useStock', () => ({
  useStock: () => ({ data: mockStockItems }),
}))

jest.mock('@/src/apis/backendApi/hooks/stock/useUpdateStock', () => ({
  useUpdateStock: () => ({ mutate: mockUpdateStock }),
}))

jest.mock('@/src/apis/backendApi/hooks/stock/useDeleteStock', () => ({
  useDeleteStock: () => ({ mutate: mockDeleteStock }),
}))

let capturedSaveLabel: string | undefined

jest.mock('@/src/features/recipes/AiRecipeGenerator', () => {
  const React = require('react')
  const { Text, TouchableOpacity } = require('react-native')
  return {
    AiRecipeGenerator: ({ onSaved, saveLabel }: any) => {
      capturedSaveLabel = saveLabel
      return React.createElement(
        TouchableOpacity,
        { testID: 'mock-save', onPress: () => onSaved(mockGeneratedRecipe) },
        React.createElement(Text, null, saveLabel ?? 'Enregistrer'),
      )
    },
  }
})

const mockGeneratedRecipe: Recipe = {
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
  steps: [],
  isFavorite: false,
}

afterEach(() => {
  cleanup()
  jest.clearAllMocks()
  mockMealTypeParam = undefined
  mockStockItems = []
  capturedSaveLabel = undefined
})

describe('RecipeGenerateScreen', () => {
  it('revient simplement en arrière sans mealType', async () => {
    mockMealTypeParam = undefined
    const { getByTestId } = await render(<RecipeGenerateScreen />)
    fireEvent.press(getByTestId('mock-save'))
    expect(mockCreateJournalEntry).not.toHaveBeenCalled()
    expect(mockRouterBack).toHaveBeenCalledTimes(1)
  })

  it('utilise le libellé par défaut sans mealType', async () => {
    mockMealTypeParam = undefined
    await render(<RecipeGenerateScreen />)
    expect(capturedSaveLabel).toBeUndefined()
  })

  it('personnalise le libellé quand un mealType est fourni', async () => {
    mockMealTypeParam = 'Déjeuner'
    await render(<RecipeGenerateScreen />)
    expect(capturedSaveLabel).toBe('Ajouter au repas')
  })

  it('ajoute la recette générée au journal du jour quand un mealType est fourni', async () => {
    mockMealTypeParam = 'Déjeuner'
    const { getByTestId } = await render(<RecipeGenerateScreen />)
    fireEvent.press(getByTestId('mock-save'))

    expect(mockCreateJournalEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        meal: expect.objectContaining({ name: 'Curry de légumes', meal: 'Déjeuner' }),
      }),
    )
    expect(mockRouterBack).toHaveBeenCalledTimes(1)
  })

  it('déduit le stock correspondant aux ingrédients de la recette générée', async () => {
    mockMealTypeParam = 'Déjeuner'
    mockStockItems = [
      { id: 'f-1', name: 'Riz', quantity: 500, unit: 'g', category: 'Sec', source: 'manual' },
    ]
    const { getByTestId } = await render(<RecipeGenerateScreen />)
    fireEvent.press(getByTestId('mock-save'))

    expect(mockUpdateStock).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'f-1', quantity: 350 }),
    )
  })
})
