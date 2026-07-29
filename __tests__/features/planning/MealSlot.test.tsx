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

const mockMeal2: PlannedMeal = {
  id: '2',
  name: 'Yaourt nature',
  kcal: 80,
  proteines: 5,
  glucides: 10,
  lipides: 2,
  meal: 'Petit-déjeuner',
}

describe('MealSlot', () => {
  describe('slot vide', () => {
    it('affiche le nom du repas', async () => {
      const { getByText } = await render(
        <MealSlot
          meal="Petit-déjeuner"
          plannedItems={[]}
          onAdd={jest.fn()}
          onPressItem={jest.fn()}
        />,
      )
      expect(getByText('Petit-déjeuner')).toBeTruthy()
    })

    it('affiche le placeholder "Aucun aliment ajouté"', async () => {
      const { getByText } = await render(
        <MealSlot meal="Déjeuner" plannedItems={[]} onAdd={jest.fn()} onPressItem={jest.fn()} />,
      )
      expect(getByText('Aucun aliment ajouté')).toBeTruthy()
    })

    it('affiche toujours le bouton +', async () => {
      const onAdd = jest.fn()
      const { getByTestId } = await render(
        <MealSlot meal="Petit-déjeuner" plannedItems={[]} onAdd={onAdd} onPressItem={jest.fn()} />,
      )
      fireEvent.press(getByTestId('add-button'))
      expect(onAdd).toHaveBeenCalledTimes(1)
    })
  })

  describe('slot rempli', () => {
    it('affiche le nom de chaque aliment', async () => {
      const { getByText } = await render(
        <MealSlot
          meal="Petit-déjeuner"
          plannedItems={[mockMeal]}
          onAdd={jest.fn()}
          onPressItem={jest.fn()}
        />,
      )
      expect(getByText('Omelette aux légumes')).toBeTruthy()
    })

    it('affiche le total des calories dans le header', async () => {
      const { getByText } = await render(
        <MealSlot
          meal="Petit-déjeuner"
          plannedItems={[mockMeal, mockMeal2]}
          onAdd={jest.fn()}
          onPressItem={jest.fn()}
        />,
      )
      // total kcal = 456 + 80 = 536
      expect(getByText('536')).toBeTruthy()
    })

    it('appelle onPressItem avec le bon item au press', async () => {
      const onPressItem = jest.fn()
      const { getAllByTestId } = await render(
        <MealSlot
          meal="Petit-déjeuner"
          plannedItems={[mockMeal, mockMeal2]}
          onAdd={jest.fn()}
          onPressItem={onPressItem}
        />,
      )
      fireEvent.press(getAllByTestId('meal-item')[0])
      expect(onPressItem).toHaveBeenCalledWith(mockMeal)
    })

    it('affiche toujours le bouton + même avec des items', async () => {
      const onAdd = jest.fn()
      const { getByTestId } = await render(
        <MealSlot
          meal="Petit-déjeuner"
          plannedItems={[mockMeal]}
          onAdd={onAdd}
          onPressItem={jest.fn()}
        />,
      )
      fireEvent.press(getByTestId('add-button'))
      expect(onAdd).toHaveBeenCalledTimes(1)
    })

    it("n'affiche pas le placeholder quand des items sont présents", async () => {
      const { queryByText } = await render(
        <MealSlot
          meal="Petit-déjeuner"
          plannedItems={[mockMeal]}
          onAdd={jest.fn()}
          onPressItem={jest.fn()}
        />,
      )
      expect(queryByText('Aucun aliment ajouté')).toBeNull()
    })
  })

  describe('mode readOnly', () => {
    it("n'affiche pas le bouton +", async () => {
      const { queryByTestId } = await render(
        <MealSlot meal="Petit-déjeuner" plannedItems={[mockMeal]} readOnly />,
      )
      expect(queryByTestId('add-button')).toBeNull()
    })

    it('affiche quand même les repas', async () => {
      const { getByText } = await render(
        <MealSlot meal="Petit-déjeuner" plannedItems={[mockMeal]} readOnly />,
      )
      expect(getByText('Omelette aux légumes')).toBeTruthy()
    })

    it("n'appelle pas onPressItem au press d'un repas", async () => {
      const onPressItem = jest.fn()
      const { getAllByTestId } = await render(
        <MealSlot
          meal="Petit-déjeuner"
          plannedItems={[mockMeal]}
          onPressItem={onPressItem}
          readOnly
        />,
      )
      fireEvent.press(getAllByTestId('meal-item')[0])
      expect(onPressItem).not.toHaveBeenCalled()
    })
  })
})
