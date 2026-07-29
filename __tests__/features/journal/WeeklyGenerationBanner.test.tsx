import { act, cleanup, fireEvent, render } from '@testing-library/react-native'
import { createStore, Provider } from 'jotai'
import React from 'react'

import { WeeklyGenerationBanner } from '@/src/features/journal/WeeklyGenerationBanner'
import { openWeeklyGenerateSheetAtom } from '@/src/store/planningAtom'
import type { MissingSlot } from '@/src/features/planning/useMissingWeeklySuggestions'

let mockMissingSlots: MissingSlot[] = []
let mockIsLoading = false

jest.mock('@/src/features/planning/useMissingWeeklySuggestions', () => ({
  useMissingWeeklySuggestions: () => ({ missingSlots: mockMissingSlots, isLoading: mockIsLoading }),
}))

afterEach(() => {
  cleanup()
  mockMissingSlots = []
  mockIsLoading = false
})

describe('WeeklyGenerationBanner', () => {
  it("n'affiche rien s'il ne manque aucun créneau", async () => {
    mockMissingSlots = []
    const { toJSON } = await render(<WeeklyGenerationBanner />)
    expect(toJSON()).toBeNull()
  })

  it('ne s’affiche pas pendant le chargement même si des créneaux manquants sont déjà connus', async () => {
    mockIsLoading = true
    mockMissingSlots = [{ dateKey: '2026-01-15', mealType: 'Déjeuner' }]
    const { toJSON } = await render(<WeeklyGenerationBanner />)
    expect(toJSON()).toBeNull()
  })

  it("affiche le bandeau s'il manque des créneaux", async () => {
    mockMissingSlots = [{ dateKey: '2026-01-15', mealType: 'Déjeuner' }]
    const { getByText } = await render(<WeeklyGenerationBanner />)
    expect(getByText('Les suggestions IA de la semaine ne sont pas encore générées')).toBeTruthy()
  })

  it('incrémente openWeeklyGenerateSheetAtom au tap', async () => {
    mockMissingSlots = [{ dateKey: '2026-01-15', mealType: 'Déjeuner' }]
    const store = createStore()
    const { getByTestId } = await render(
      <Provider store={store}>
        <WeeklyGenerationBanner />
      </Provider>,
    )

    await act(async () => {
      fireEvent.press(getByTestId('weekly-generation-banner'))
    })

    expect(store.get(openWeeklyGenerateSheetAtom)).toBe(1)
  })
})
