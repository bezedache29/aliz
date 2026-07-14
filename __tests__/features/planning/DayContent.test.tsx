import { act, render } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createStore, Provider } from 'jotai'
import React from 'react'

import dayjs from '@/src/config/dayjs'
import { DayContent } from '@/src/features/planning/DayContent'
import { type StravaActivity } from '@/src/models/activity/strava-activity.model'
import { selectedDateAtom } from '@/src/store/planningAtom'

const FIXED_DATE = dayjs('2026-06-24')

let mockActivities: StravaActivity[] = []

jest.mock('@/src/apis/backendApi/hooks/activity/useActivities', () => ({
  useActivities: () => ({ data: mockActivities, isLoading: false, refetch: jest.fn() }),
}))

jest.mock('@/src/apis/backendApi/hooks/planning/usePlanningWeek', () => ({
  usePlanningWeek: jest.fn().mockReturnValue({
    data: [
      {
        meal: 'Petit-déjeuner',
        status: 'done',
        recipe: { id: 'r1', name: 'Porridge', kcal: 350, proteines: 10, glucides: 50, lipides: 8 },
      },
      {
        meal: 'Déjeuner',
        status: 'done',
        recipe: {
          id: 'r2',
          name: 'Bowl de quinoa',
          kcal: 620,
          proteines: 45,
          glucides: 52,
          lipides: 18,
        },
      },
      {
        meal: 'Collation',
        status: 'done',
        recipe: {
          id: 'r3',
          name: 'Yaourt grec',
          kcal: 200,
          proteines: 10,
          glucides: 15,
          lipides: 8,
        },
      },
      {
        meal: 'Dîner',
        status: 'done',
        recipe: {
          id: 'r4',
          name: 'Saumon vapeur',
          kcal: 520,
          proteines: 40,
          glucides: 15,
          lipides: 28,
        },
      },
    ],
    isLoading: false,
    isSuccess: true,
  }),
}))

jest.mock('@/src/apis/backendApi/hooks/planning/useRegenerateMealSlot', () => ({
  useRegenerateMealSlot: jest.fn().mockReturnValue({
    mutate: jest.fn(),
    isPending: false,
  }),
}))

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

async function renderDayContent() {
  const store = createStore()
  store.set(selectedDateAtom, FIXED_DATE)
  const queryClient = new QueryClient()
  const result = await render(
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <DayContent />
      </Provider>
    </QueryClientProvider>,
  )
  return { result, store }
}

const makeActivity = (overrides: Partial<StravaActivity> = {}): StravaActivity => ({
  id: 'act-1',
  name: 'Sortie VTT',
  type: 'MountainBikeRide',
  startedAt: '2026-06-24T08:00:00.000Z',
  distance: 15000.5,
  movingTime: 3600,
  elapsedTime: 3700,
  totalElevationGain: 420,
  calories: 870.2,
  ...overrides,
})

describe('DayContent', () => {
  beforeEach(() => {
    mockActivities = []
  })

  describe('affichage du jour sélectionné', () => {
    it('affiche le nom du jour en majuscules', async () => {
      const { result } = await renderDayContent()
      expect(result.getByText('MERCREDI')).toBeTruthy()
    })

    it('affiche la date formatée', async () => {
      const { result } = await renderDayContent()
      expect(result.getByText('24 juin')).toBeTruthy()
    })
  })

  describe('affichage des slots', () => {
    it('affiche les 4 types de repas', async () => {
      const { result } = await renderDayContent()
      expect(result.getAllByText('Petit-déjeuner').length).toBeGreaterThanOrEqual(1)
      expect(result.getAllByText('Déjeuner').length).toBeGreaterThanOrEqual(1)
      expect(result.getAllByText('Collation').length).toBeGreaterThanOrEqual(1)
      expect(result.getAllByText('Dîner').length).toBeGreaterThanOrEqual(1)
    })

    it('affiche les noms des recettes', async () => {
      const { result } = await renderDayContent()
      expect(result.getByText('Porridge')).toBeTruthy()
      expect(result.getByText('Bowl de quinoa')).toBeTruthy()
    })

    it('appelle usePlanningWeek avec la date du jour sélectionné', async () => {
      const { usePlanningWeek } = require('@/src/apis/backendApi/hooks/planning/usePlanningWeek')
      usePlanningWeek.mockClear()
      await renderDayContent()
      await act(async () => {})
      expect(usePlanningWeek).toHaveBeenCalledWith('2026-06-24')
    })
  })

  describe('activités Strava du jour', () => {
    it("affiche l'état vide quand il n'y a aucune activité", async () => {
      const { result } = await renderDayContent()
      expect(result.getByText('Activités')).toBeTruthy()
      expect(result.getByText('Aucune activité ce jour.')).toBeTruthy()
    })

    it("affiche l'état vide pour une activité d'un autre jour", async () => {
      mockActivities = [makeActivity({ startedAt: '2026-06-20T08:00:00.000Z' })]
      const { result } = await renderDayContent()
      expect(result.getByText('Aucune activité ce jour.')).toBeTruthy()
    })

    it('affiche les activités du jour sélectionné', async () => {
      mockActivities = [makeActivity({ name: 'Sortie VTT' })]
      const { result } = await renderDayContent()
      expect(result.getByText('Activités')).toBeTruthy()
      expect(result.getByText('Sortie VTT')).toBeTruthy()
      expect(result.getByText('15.0 km')).toBeTruthy()
      expect(result.getByText('1h00')).toBeTruthy()
      expect(result.getByText('420 m D+')).toBeTruthy()
      expect(result.getByText('870 kcal')).toBeTruthy()
    })
  })
})
