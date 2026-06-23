import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'

import { MealSlot } from '@/src/features/planning/MealSlot'
import type { PlannedMeal } from '@/src/models/planning/planning.model'

const mockMeal: PlannedMeal = {
  id: '1',
  name: 'Omelette aux légumes',
  kcal: 456,
  proteines: 32,
  glucides: 12,
  lipides: 28,
  meal: 'Petit-déjeuner',
}

describe('MealSlot', () => {
  describe('slot vide', () => {
    it('affiche le nom du repas', async () => {
      const { getByText } = await render(
        <MealSlot meal="Petit-déjeuner" onAdd={jest.fn()} onRemove={jest.fn()} />,
      )
      expect(getByText('Petit-déjeuner')).toBeTruthy()
    })

    it('affiche le placeholder "Aucun repas planifié"', async () => {
      const { getByText } = await render(
        <MealSlot meal="Déjeuner" onAdd={jest.fn()} onRemove={jest.fn()} />,
      )
      expect(getByText('Aucun repas planifié')).toBeTruthy()
    })

    it('appelle onAdd au press du bouton +', async () => {
      const onAdd = jest.fn()
      const { getByTestId } = await render(
        <MealSlot meal="Petit-déjeuner" onAdd={onAdd} onRemove={jest.fn()} />,
      )
      fireEvent.press(getByTestId('add-button'))
      expect(onAdd).toHaveBeenCalledTimes(1)
    })

    it("n'affiche pas le bouton supprimer", async () => {
      const { queryByTestId } = await render(
        <MealSlot meal="Collation" onAdd={jest.fn()} onRemove={jest.fn()} />,
      )
      expect(queryByTestId('remove-button')).toBeNull()
    })
  })

  describe('slot rempli', () => {
    it('affiche le nom de la recette', async () => {
      const { getByText } = await render(
        <MealSlot
          meal="Petit-déjeuner"
          planned={mockMeal}
          onAdd={jest.fn()}
          onRemove={jest.fn()}
        />,
      )
      expect(getByText('Omelette aux légumes')).toBeTruthy()
    })

    it('affiche les calories', async () => {
      const { getByText } = await render(
        <MealSlot
          meal="Petit-déjeuner"
          planned={mockMeal}
          onAdd={jest.fn()}
          onRemove={jest.fn()}
        />,
      )
      expect(getByText('456 kcal')).toBeTruthy()
    })

    it('affiche les trois macros', async () => {
      const { getByText } = await render(
        <MealSlot
          meal="Petit-déjeuner"
          planned={mockMeal}
          onAdd={jest.fn()}
          onRemove={jest.fn()}
        />,
      )
      expect(getByText('P 32g')).toBeTruthy()
      expect(getByText('G 12g')).toBeTruthy()
      expect(getByText('L 28g')).toBeTruthy()
    })

    it('appelle onRemove au press du bouton ×', async () => {
      const onRemove = jest.fn()
      const { getByTestId } = await render(
        <MealSlot meal="Petit-déjeuner" planned={mockMeal} onAdd={jest.fn()} onRemove={onRemove} />,
      )
      fireEvent.press(getByTestId('remove-button'))
      expect(onRemove).toHaveBeenCalledTimes(1)
    })

    it("n'affiche pas le placeholder", async () => {
      const { queryByText } = await render(
        <MealSlot
          meal="Petit-déjeuner"
          planned={mockMeal}
          onAdd={jest.fn()}
          onRemove={jest.fn()}
        />,
      )
      expect(queryByText('Aucun repas planifié')).toBeNull()
    })
  })
})
