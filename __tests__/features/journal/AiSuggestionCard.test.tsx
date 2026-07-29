import { cleanup, fireEvent, render } from '@testing-library/react-native'
import React from 'react'

import { AiSuggestionCard } from '@/src/features/journal/AiSuggestionCard'
import type { PlannedRecipeCourse } from '@/src/models/planning/planning.model'

afterEach(cleanup)

const suggestion: PlannedRecipeCourse = {
  course: 'Plat',
  recipe: {
    id: 'r1',
    name: 'Poulet rôti',
    kcal: 450,
    proteines: 40,
    glucides: 15,
    lipides: 20,
    ingredients: [],
  },
}

function renderCard(overrides: Partial<React.ComponentProps<typeof AiSuggestionCard>> = {}) {
  return render(
    <AiSuggestionCard
      suggestion={suggestion}
      onAccept={jest.fn()}
      onModify={jest.fn()}
      onRegenerate={jest.fn()}
      onOpenRegeneratePrompt={jest.fn()}
      onReject={jest.fn()}
      onViewDetails={jest.fn()}
      {...overrides}
    />,
  )
}

describe('AiSuggestionCard', () => {
  it('affiche le nom de la recette et le libellé du plat', async () => {
    const { getByText } = await renderCard()
    expect(getByText('Poulet rôti')).toBeTruthy()
    expect(getByText('Suggestion IA · Plat')).toBeTruthy()
  })

  it('affiche les kcal de la suggestion', async () => {
    const { getByText } = await renderCard()
    expect(getByText('450 kcal')).toBeTruthy()
  })

  it('affiche les macros', async () => {
    const { getByText } = await renderCard()
    expect(getByText('P40g')).toBeTruthy()
    expect(getByText('G15g')).toBeTruthy()
    expect(getByText('L20g')).toBeTruthy()
  })

  it('appelle onAccept au clic sur Accepter', async () => {
    const onAccept = jest.fn()
    const { getByTestId } = await renderCard({ onAccept })
    fireEvent.press(getByTestId('suggestion-accept'))
    expect(onAccept).toHaveBeenCalledTimes(1)
  })

  it('appelle onModify au clic sur Modifier', async () => {
    const onModify = jest.fn()
    const { getByTestId } = await renderCard({ onModify })
    fireEvent.press(getByTestId('suggestion-modify'))
    expect(onModify).toHaveBeenCalledTimes(1)
  })

  it('appelle onRegenerate au clic sur le bouton de régénération rapide', async () => {
    const onRegenerate = jest.fn()
    const { getByTestId } = await renderCard({ onRegenerate })
    fireEvent.press(getByTestId('suggestion-regenerate'))
    expect(onRegenerate).toHaveBeenCalledTimes(1)
  })

  it('appelle onOpenRegeneratePrompt au clic sur le bouton "avec consigne"', async () => {
    const onOpenRegeneratePrompt = jest.fn()
    const { getByTestId } = await renderCard({ onOpenRegeneratePrompt })
    fireEvent.press(getByTestId('suggestion-regenerate-prompt'))
    expect(onOpenRegeneratePrompt).toHaveBeenCalledTimes(1)
  })

  it('appelle onReject au clic sur le bouton de rejet', async () => {
    const onReject = jest.fn()
    const { getByTestId } = await renderCard({ onReject })
    fireEvent.press(getByTestId('suggestion-reject'))
    expect(onReject).toHaveBeenCalledTimes(1)
  })

  it('appelle onViewDetails au tap sur le contenu de la carte', async () => {
    const onViewDetails = jest.fn()
    const { getByTestId } = await renderCard({ onViewDetails })
    fireEvent.press(getByTestId('suggestion-view-details'))
    expect(onViewDetails).toHaveBeenCalledTimes(1)
  })

  it('affiche un libellé générique quand le plat est sans nom de course', async () => {
    const singleDish: PlannedRecipeCourse = { ...suggestion, course: '' }
    const { getByText } = await renderCard({ suggestion: singleDish })
    expect(getByText('Suggestion IA')).toBeTruthy()
  })

  it('désactive les actions pendant la régénération', async () => {
    const onAccept = jest.fn()
    const onModify = jest.fn()
    const onRegenerate = jest.fn()
    const onReject = jest.fn()
    const { getByTestId } = await renderCard({
      onAccept,
      onModify,
      onRegenerate,
      onReject,
      isRegenerating: true,
    })
    fireEvent.press(getByTestId('suggestion-accept'))
    fireEvent.press(getByTestId('suggestion-modify'))
    fireEvent.press(getByTestId('suggestion-regenerate'))
    fireEvent.press(getByTestId('suggestion-reject'))
    expect(onAccept).not.toHaveBeenCalled()
    expect(onModify).not.toHaveBeenCalled()
    expect(onRegenerate).not.toHaveBeenCalled()
    expect(onReject).not.toHaveBeenCalled()
  })
})
