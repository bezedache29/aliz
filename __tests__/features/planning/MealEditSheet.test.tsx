import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import React from 'react'

import { MealEditSheet } from '@/src/features/planning/MealEditSheet'

// Mock gorhom/bottom-sheet pour RNTL
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
    BottomSheetTextInput: require('react-native').TextInput,
  }
})

afterEach(cleanup)

describe('MealEditSheet', () => {
  it('affiche le nom du repas dans le titre', async () => {
    const { getByText } = await render(
      <MealEditSheet
        mealType="Déjeuner"
        recipeName="Bowl de quinoa"
        onRegenerate={jest.fn()}
        onSendPrompt={jest.fn()}
      />,
    )
    expect(getByText('Déjeuner')).toBeTruthy()
  })

  it('affiche le nom de la recette actuelle', async () => {
    const { getByText } = await render(
      <MealEditSheet
        mealType="Déjeuner"
        recipeName="Bowl de quinoa"
        onRegenerate={jest.fn()}
        onSendPrompt={jest.fn()}
      />,
    )
    expect(getByText('Bowl de quinoa')).toBeTruthy()
  })

  it('affiche le bouton Régénérer', async () => {
    const { getByTestId } = await render(
      <MealEditSheet
        mealType="Dîner"
        recipeName="Saumon vapeur"
        onRegenerate={jest.fn()}
        onSendPrompt={jest.fn()}
      />,
    )
    expect(getByTestId('regenerate-button')).toBeTruthy()
  })

  it('appelle onRegenerate au press du bouton Régénérer', async () => {
    const onRegenerate = jest.fn()
    const { getByTestId } = await render(
      <MealEditSheet
        mealType="Dîner"
        recipeName="Saumon vapeur"
        onRegenerate={onRegenerate}
        onSendPrompt={jest.fn()}
      />,
    )
    fireEvent.press(getByTestId('regenerate-button'))
    expect(onRegenerate).toHaveBeenCalledTimes(1)
  })

  it("affiche un champ texte pour expliquer à l'IA", async () => {
    const { getByTestId } = await render(
      <MealEditSheet
        mealType="Collation"
        recipeName="Yaourt grec"
        onRegenerate={jest.fn()}
        onSendPrompt={jest.fn()}
      />,
    )
    expect(getByTestId('prompt-input')).toBeTruthy()
  })

  it("appelle onSendPrompt avec le texte saisi au press d'envoyer", async () => {
    const onSendPrompt = jest.fn()
    const { getByTestId } = await render(
      <MealEditSheet
        mealType="Collation"
        recipeName="Yaourt grec"
        onRegenerate={jest.fn()}
        onSendPrompt={onSendPrompt}
      />,
    )
    await act(async () => {
      fireEvent.changeText(getByTestId('prompt-input'), 'sans lactose')
      fireEvent.press(getByTestId('send-prompt-button'))
    })
    expect(onSendPrompt).toHaveBeenCalledWith('sans lactose')
  })

  it("n'appelle pas onSendPrompt si le champ est vide", async () => {
    const onSendPrompt = jest.fn()
    const { getByTestId } = await render(
      <MealEditSheet
        mealType="Collation"
        recipeName="Yaourt grec"
        onRegenerate={jest.fn()}
        onSendPrompt={onSendPrompt}
      />,
    )
    fireEvent.press(getByTestId('send-prompt-button'))
    expect(onSendPrompt).not.toHaveBeenCalled()
  })

  it('vide le champ après envoi du prompt', async () => {
    const { getByTestId } = await render(
      <MealEditSheet
        mealType="Collation"
        recipeName="Yaourt grec"
        onRegenerate={jest.fn()}
        onSendPrompt={jest.fn()}
      />,
    )
    const input = getByTestId('prompt-input')
    fireEvent.changeText(input, 'sans gluten')
    fireEvent.press(getByTestId('send-prompt-button'))
    await waitFor(() => {
      expect(input.props.value).toBe('')
    })
  })
})
