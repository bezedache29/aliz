import { cleanup, fireEvent, render } from '@testing-library/react-native'
import React from 'react'

import { MealAddPickerSheet } from '@/src/features/planning/MealAddPickerSheet'

jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    BottomSheetModal: (() => {
      const C = React.forwardRef(({ children }: any, _ref: any) =>
        React.createElement(View, { testID: 'bottom-sheet-modal' }, children),
      )
      C.displayName = 'BottomSheetModal'
      return C
    })(),
    BottomSheetView: ({ children }: any) => React.createElement(View, null, children),
    BottomSheetBackdrop: () => null,
  }
})

afterEach(cleanup)

function renderSheet(overrides: Partial<React.ComponentProps<typeof MealAddPickerSheet>> = {}) {
  return render(
    <MealAddPickerSheet
      mealType="Petit-déjeuner"
      onSelectFood={jest.fn()}
      onSelectRecipe={jest.fn()}
      onSelectAiRecipe={jest.fn()}
      {...overrides}
    />,
  )
}

describe('MealAddPickerSheet', () => {
  it('affiche le repas ciblé dans le titre', async () => {
    const { getByText } = await renderSheet()
    expect(getByText('Ajouter à — Petit-déjeuner')).toBeTruthy()
  })

  it('affiche les 3 options', async () => {
    const { getByText } = await renderSheet()
    expect(getByText('Aliment unique')).toBeTruthy()
    expect(getByText('Recette')).toBeTruthy()
    expect(getByText('Recette générée par IA')).toBeTruthy()
  })

  it('appelle onSelectFood au press sur "Aliment unique"', async () => {
    const onSelectFood = jest.fn()
    const { getByTestId } = await renderSheet({ onSelectFood })
    fireEvent.press(getByTestId('add-food-option'))
    expect(onSelectFood).toHaveBeenCalledTimes(1)
  })

  it('appelle onSelectRecipe au press sur "Recette"', async () => {
    const onSelectRecipe = jest.fn()
    const { getByTestId } = await renderSheet({ onSelectRecipe })
    fireEvent.press(getByTestId('add-recipe-option'))
    expect(onSelectRecipe).toHaveBeenCalledTimes(1)
  })

  it('appelle onSelectAiRecipe au press sur "Recette générée par IA"', async () => {
    const onSelectAiRecipe = jest.fn()
    const { getByTestId } = await renderSheet({ onSelectAiRecipe })
    fireEvent.press(getByTestId('add-ai-recipe-option'))
    expect(onSelectAiRecipe).toHaveBeenCalledTimes(1)
  })
})
