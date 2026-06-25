import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'

import { RecipeSlot } from '@/src/features/planning/RecipeSlot'
import type { AiRecipeSuggestion } from '@/src/models/planning/planning.model'

const mockRecipe: AiRecipeSuggestion = {
  id: 'r1',
  name: 'Bowl de quinoa au poulet grillé',
  kcal: 620,
  proteines: 45,
  glucides: 52,
  lipides: 18,
  prepTime: 10,
  cookTime: 20,
}

describe('RecipeSlot — état loading', () => {
  it('affiche le nom du repas', async () => {
    const { getByText } = await render(
      <RecipeSlot meal="Déjeuner" status="loading" onPress={jest.fn()} />,
    )
    expect(getByText('Déjeuner')).toBeTruthy()
  })

  it('affiche un indicateur de chargement', async () => {
    const { getByTestId } = await render(
      <RecipeSlot meal="Déjeuner" status="loading" onPress={jest.fn()} />,
    )
    expect(getByTestId('recipe-slot-loading')).toBeTruthy()
  })

  it("n'affiche pas de nom de recette", async () => {
    const { queryByTestId } = await render(
      <RecipeSlot meal="Déjeuner" status="loading" onPress={jest.fn()} />,
    )
    expect(queryByTestId('recipe-name')).toBeNull()
  })
})

describe('RecipeSlot — état done avec recette', () => {
  it('affiche le nom du repas', async () => {
    const { getByText } = await render(
      <RecipeSlot meal="Déjeuner" status="done" recipe={mockRecipe} onPress={jest.fn()} />,
    )
    expect(getByText('Déjeuner')).toBeTruthy()
  })

  it('affiche le nom de la recette', async () => {
    const { getByTestId } = await render(
      <RecipeSlot meal="Déjeuner" status="done" recipe={mockRecipe} onPress={jest.fn()} />,
    )
    expect(getByTestId('recipe-name').props.children).toBe('Bowl de quinoa au poulet grillé')
  })

  it('affiche les calories', async () => {
    const { getByText } = await render(
      <RecipeSlot meal="Déjeuner" status="done" recipe={mockRecipe} onPress={jest.fn()} />,
    )
    // kcal et la valeur sont dans deux <Text> séparés
    expect(getByText('620')).toBeTruthy()
    expect(getByText('kcal')).toBeTruthy()
  })

  it('affiche les trois macros', async () => {
    const { getByText } = await render(
      <RecipeSlot meal="Déjeuner" status="done" recipe={mockRecipe} onPress={jest.fn()} />,
    )
    // label et valeur sont dans deux <Text> séparés dans MacroInline
    expect(getByText('P')).toBeTruthy()
    expect(getByText('45g')).toBeTruthy()
    expect(getByText('G')).toBeTruthy()
    expect(getByText('52g')).toBeTruthy()
    expect(getByText('L')).toBeTruthy()
    expect(getByText('18g')).toBeTruthy()
  })

  it('affiche le temps de préparation + cuisson', async () => {
    const { getByText } = await render(
      <RecipeSlot meal="Déjeuner" status="done" recipe={mockRecipe} onPress={jest.fn()} />,
    )
    expect(getByText('30 min')).toBeTruthy()
  })

  it('appelle onPress au tap sur le slot', async () => {
    const onPress = jest.fn()
    const { getByTestId } = await render(
      <RecipeSlot meal="Déjeuner" status="done" recipe={mockRecipe} onPress={onPress} />,
    )
    fireEvent.press(getByTestId('recipe-slot-pressable'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })
})

describe('RecipeSlot — état idle', () => {
  it('affiche le nom du repas', async () => {
    const { getByText } = await render(
      <RecipeSlot meal="Dîner" status="idle" onPress={jest.fn()} />,
    )
    expect(getByText('Dîner')).toBeTruthy()
  })

  it('affiche un placeholder en attente de génération', async () => {
    const { getByTestId } = await render(
      <RecipeSlot meal="Dîner" status="idle" onPress={jest.fn()} />,
    )
    expect(getByTestId('recipe-slot-idle')).toBeTruthy()
  })
})
