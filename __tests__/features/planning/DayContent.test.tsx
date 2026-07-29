import { render } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createStore, Provider } from 'jotai'
import React from 'react'

import dayjs from '@/src/config/dayjs'
import { DayContent } from '@/src/features/planning/DayContent'
import { type StravaActivity } from '@/src/models/activity/strava-activity.model'
import type { PlannedMeal } from '@/src/models/planning/planning.model'
import { selectedDateAtom } from '@/src/store/planningAtom'

const FIXED_DATE = dayjs('2026-06-24')

let mockActivities: StravaActivity[] = []
let mockMeals: PlannedMeal[] = []

jest.mock('@/src/apis/backendApi/hooks/activity/useActivities', () => ({
  useActivities: () => ({ data: mockActivities, isLoading: false, refetch: jest.fn() }),
}))

jest.mock('@/src/apis/backendApi/hooks/journal/useJournalEntries', () => ({
  useJournalEntries: () => ({ data: mockMeals, isLoading: false, refetch: jest.fn() }),
}))

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

const makeMeal = (overrides: Partial<PlannedMeal> = {}): PlannedMeal => ({
  id: 'm-1',
  name: 'Porridge',
  kcal: 350,
  proteines: 10,
  glucides: 50,
  lipides: 8,
  meal: 'Petit-déjeuner',
  ...overrides,
})

describe('DayContent', () => {
  beforeEach(() => {
    mockActivities = []
    mockMeals = []
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

  describe('récap des repas du Journal', () => {
    it('affiche les 4 types de repas', async () => {
      const { result } = await renderDayContent()
      expect(result.getAllByText('Petit-déjeuner').length).toBeGreaterThanOrEqual(1)
      expect(result.getAllByText('Déjeuner').length).toBeGreaterThanOrEqual(1)
      expect(result.getAllByText('Collation').length).toBeGreaterThanOrEqual(1)
      expect(result.getAllByText('Dîner').length).toBeGreaterThanOrEqual(1)
    })

    it('affiche les repas réellement journalisés du jour', async () => {
      mockMeals = [
        makeMeal({ name: 'Porridge' }),
        makeMeal({ id: 'm-2', name: 'Poulet rôti', meal: 'Déjeuner' }),
      ]
      const { result } = await renderDayContent()
      expect(result.getByText('Porridge')).toBeTruthy()
      expect(result.getByText('Poulet rôti')).toBeTruthy()
    })

    it("n'affiche aucun bouton d'ajout (lecture seule)", async () => {
      const { result } = await renderDayContent()
      expect(result.queryByTestId('add-button')).toBeNull()
    })

    it('affiche le placeholder quand aucun repas ce jour-là', async () => {
      const { result } = await renderDayContent()
      expect(result.getAllByText('Aucun aliment ajouté').length).toBe(4)
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
