import { cleanup, render } from '@testing-library/react-native'
import React from 'react'

import { RecipeDetailSheet } from '@/src/features/journal/RecipeDetailSheet'
import type { PlannedRecipeCourse } from '@/src/models/planning/planning.model'

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

const course: PlannedRecipeCourse = {
  course: 'Plat',
  recipe: {
    id: 'r1',
    name: 'Bowl de quinoa',
    kcal: 620,
    proteines: 45,
    glucides: 52,
    lipides: 18,
    prepTime: 10,
    cookTime: 20,
    description: 'Un bowl complet et rassasiant.',
    steps: ['Cuire le quinoa', 'Mélanger les ingrédients'],
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
    ],
  },
}

describe('RecipeDetailSheet', () => {
  it('affiche le nom de la recette et le libellé du plat', async () => {
    const { getByText } = await render(<RecipeDetailSheet course={course} />)
    expect(getByText('Bowl de quinoa')).toBeTruthy()
    expect(getByText('Plat')).toBeTruthy()
  })

  it('affiche les kcal et le temps total', async () => {
    const { getByText } = await render(<RecipeDetailSheet course={course} />)
    expect(getByText('620')).toBeTruthy()
    expect(getByText('30 min')).toBeTruthy()
  })

  it('affiche les macros', async () => {
    const { getByText } = await render(<RecipeDetailSheet course={course} />)
    expect(getByText('P45g')).toBeTruthy()
    expect(getByText('G52g')).toBeTruthy()
    expect(getByText('L18g')).toBeTruthy()
  })

  it('affiche la description', async () => {
    const { getByText } = await render(<RecipeDetailSheet course={course} />)
    expect(getByText('Un bowl complet et rassasiant.')).toBeTruthy()
  })

  it('affiche les ingrédients avec leur quantité', async () => {
    const { getByText } = await render(<RecipeDetailSheet course={course} />)
    expect(getByText('Quinoa cuit')).toBeTruthy()
    expect(getByText(/150 g/)).toBeTruthy()
  })

  it('affiche les étapes numérotées', async () => {
    const { getByText } = await render(<RecipeDetailSheet course={course} />)
    expect(getByText('Préparation')).toBeTruthy()
    expect(getByText('Cuire le quinoa')).toBeTruthy()
    expect(getByText('Mélanger les ingrédients')).toBeTruthy()
    expect(getByText('1')).toBeTruthy()
    expect(getByText('2')).toBeTruthy()
  })

  it("n'affiche pas la section préparation sans étapes", async () => {
    const noSteps: PlannedRecipeCourse = { ...course, recipe: { ...course.recipe, steps: [] } }
    const { queryByText } = await render(<RecipeDetailSheet course={noSteps} />)
    expect(queryByText('Préparation')).toBeNull()
  })

  it('ne masque pas le temps quand prepTime/cookTime sont absents', async () => {
    const noTime: PlannedRecipeCourse = {
      ...course,
      recipe: { ...course.recipe, prepTime: undefined, cookTime: undefined },
    }
    const { queryByText } = await render(<RecipeDetailSheet course={noTime} />)
    expect(queryByText(/min/)).toBeNull()
  })

  it("n'affiche rien de particulier quand aucune suggestion n'est fournie", async () => {
    const { queryByText } = await render(<RecipeDetailSheet course={null} />)
    expect(queryByText('Bowl de quinoa')).toBeNull()
  })
})
