import { cleanup, render } from '@testing-library/react-native'
import { createStore, Provider } from 'jotai'
import React from 'react'

import JournalScreen from '@/src/screens/journal/JournalScreen'
import { type StravaActivity } from '@/src/models/activity/strava-activity.model'

let mockActivities: StravaActivity[] = []

jest.mock('@/src/apis/backendApi/hooks/activity/useActivities', () => ({
  useActivities: () => ({ data: mockActivities, isLoading: false, refetch: jest.fn() }),
}))

jest.mock('@/src/apis/backendApi/hooks/weight/useWeightHistory', () => ({
  useWeightHistory: () => ({ data: [], isLoading: false, refetch: jest.fn() }),
}))

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}))

// AvatarButton dépend de useNavigation (contexte expo-router absent en test unitaire)
jest.mock('@/src/components/avatar-button', () => ({
  AvatarButton: () => null,
}))

jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react')
  const ForwardedBottomSheetModal = React.forwardRef((_props: any, _ref: any) => null)
  ForwardedBottomSheetModal.displayName = 'BottomSheetModal'
  return {
    BottomSheetModal: ForwardedBottomSheetModal,
    BottomSheetView: ({ children }: any) => children,
    BottomSheetBackdrop: () => null,
  }
})

jest.mock('@/src/features/planning/MealAddPickerSheet', () => ({
  MealAddPickerSheet: () => null,
}))

jest.mock('@/src/features/planning/MealItemEditSheet', () => ({
  MealItemEditSheet: () => null,
}))

const makeActivity = (overrides: Partial<StravaActivity> = {}): StravaActivity => ({
  id: 'act-1',
  name: 'Sortie VTT',
  type: 'MountainBikeRide',
  startedAt: new Date().toISOString(),
  distance: 15000.5,
  movingTime: 3600,
  elapsedTime: 3700,
  totalElevationGain: 420,
  calories: 870.2,
  ...overrides,
})

function renderWithStore(ui: React.ReactElement, store = createStore()) {
  return render(<Provider store={store}>{ui}</Provider>)
}

beforeEach(() => {
  mockActivities = []
})

afterEach(cleanup)

describe('JournalScreen — carte Activités du jour', () => {
  it("affiche l'état vide quand il n'y a aucune activité", async () => {
    const { getByText } = await renderWithStore(<JournalScreen />)
    expect(getByText('Activités du jour')).toBeTruthy()
    expect(getByText("Aucune activité aujourd'hui.")).toBeTruthy()
  })

  it("affiche l'état vide pour une activité d'un autre jour", async () => {
    mockActivities = [makeActivity({ startedAt: '2020-01-01T08:00:00.000Z' })]
    const { getByText } = await renderWithStore(<JournalScreen />)
    expect(getByText("Aucune activité aujourd'hui.")).toBeTruthy()
  })

  it("affiche la carte et l'activité du jour", async () => {
    mockActivities = [makeActivity({ name: 'Sortie VTT' })]
    const { getByText } = await renderWithStore(<JournalScreen />)
    expect(getByText('Activités du jour')).toBeTruthy()
    expect(getByText('Sortie VTT')).toBeTruthy()
    expect(getByText('15.0 km')).toBeTruthy()
    expect(getByText('1h00')).toBeTruthy()
    expect(getByText('420 m D+')).toBeTruthy()
    expect(getByText('870 kcal')).toBeTruthy()
  })

  it('affiche uniquement les activités du jour parmi plusieurs', async () => {
    mockActivities = [
      makeActivity({ id: 'today', name: 'Sortie du jour' }),
      makeActivity({ id: 'yesterday', name: 'Sortie hier', startedAt: '2020-01-01T08:00:00.000Z' }),
    ]
    const { getByText, queryByText } = await renderWithStore(<JournalScreen />)
    expect(getByText('Sortie du jour')).toBeTruthy()
    expect(queryByText('Sortie hier')).toBeNull()
  })
})
