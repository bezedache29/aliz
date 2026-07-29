import { act, cleanup, fireEvent, render } from '@testing-library/react-native'
import React from 'react'

import { IngredientEditSheet } from '@/src/features/journal/IngredientEditSheet'
import type { PlannedRecipeCourse } from '@/src/models/planning/planning.model'

// Mock gorhom/bottom-sheet pour RNTL
jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react')
  const { View, ScrollView } = require('react-native')
  return {
    BottomSheetModal: (() => {
      const C = React.forwardRef(({ children }: any, _ref: any) =>
        React.createElement(View, { testID: 'bottom-sheet-modal' }, children),
      )
      C.displayName = 'BottomSheetModal'
      return C
    })(),
    BottomSheetScrollView: ({ children, ...props }: any) =>
      React.createElement(ScrollView, props, children),
    BottomSheetBackdrop: () => null,
  }
})

afterEach(cleanup)

const suggestion: PlannedRecipeCourse = {
  course: 'Plat',
  recipe: {
    id: 'r1',
    name: 'Bowl de quinoa',
    kcal: 400,
    proteines: 20,
    glucides: 30,
    lipides: 10,
    ingredients: [
      {
        food: {
          id: 'f1',
          name: 'Quinoa cuit',
          source: 'manual',
          per100g: { kcal: 120, proteines: 4, glucides: 21, lipides: 2 },
        },
        quantityG: 150,
      },
      {
        food: {
          id: 'f2',
          name: 'Poulet grillé',
          source: 'manual',
          per100g: { kcal: 165, proteines: 31, glucides: 0, lipides: 4 },
        },
        quantityG: 100,
      },
    ],
  },
}

describe('IngredientEditSheet', () => {
  it('affiche le nom de la recette et ses ingrédients', async () => {
    const { getByText } = await render(
      <IngredientEditSheet suggestion={suggestion} mealType="Déjeuner" onConfirm={jest.fn()} />,
    )
    expect(getByText('Bowl de quinoa')).toBeTruthy()
    expect(getByText('Quinoa cuit')).toBeTruthy()
    expect(getByText('Poulet grillé')).toBeTruthy()
  })

  it('retire un ingrédient de la liste', async () => {
    const { getAllByTestId, queryByText } = await render(
      <IngredientEditSheet suggestion={suggestion} mealType="Déjeuner" onConfirm={jest.fn()} />,
    )
    await act(async () => {
      fireEvent.press(getAllByTestId('ingredient-remove')[1])
    })
    expect(queryByText('Poulet grillé')).toBeNull()
  })

  it('recalcule les macros quand une quantité change', async () => {
    const { getAllByTestId, getByText } = await render(
      <IngredientEditSheet suggestion={suggestion} mealType="Déjeuner" onConfirm={jest.fn()} />,
    )
    // 150g de quinoa à 120 kcal/100g + 100g de poulet à 165 kcal/100g = 345 kcal
    expect(getByText('345')).toBeTruthy()

    await act(async () => {
      fireEvent.changeText(getAllByTestId('ingredient-quantity')[0], '300')
    })
    // 300g de quinoa (360 kcal) + 100g de poulet (165 kcal) = 525 kcal
    expect(getByText('525')).toBeTruthy()
  })

  it('appelle onConfirm avec la liste des ingrédients édités', async () => {
    const onConfirm = jest.fn()
    const { getByTestId, getAllByTestId } = await render(
      <IngredientEditSheet suggestion={suggestion} mealType="Déjeuner" onConfirm={onConfirm} />,
    )
    await act(async () => {
      fireEvent.press(getAllByTestId('ingredient-remove')[1])
    })
    await act(async () => {
      fireEvent.press(getByTestId('confirm-button'))
    })

    expect(onConfirm).toHaveBeenCalledTimes(1)
    const ingredients = onConfirm.mock.calls[0][0]
    expect(ingredients).toHaveLength(1)
    expect(ingredients[0].food.name).toBe('Quinoa cuit')
  })
})
