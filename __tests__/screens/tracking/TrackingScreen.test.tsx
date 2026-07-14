import { act, cleanup, fireEvent, render } from '@testing-library/react-native'
import { createStore, Provider } from 'jotai'
import React from 'react'

import TrackingScreen from '@/src/screens/tracking/TrackingScreen'
import { onboardingAtom } from '@/src/store/onboardingAtom'
import { type WeightEntry } from '@/src/models/weight/weight.model'
import { type StravaActivity } from '@/src/models/activity/strava-activity.model'

// Mock des hooks React Query — remplacent l'appel réseau
const mockDeleteWeight = jest.fn()
let mockHistory: WeightEntry[] = []
let mockIsLoading = false
let mockActivities: StravaActivity[] = []
let mockIsActivitiesLoading = false
let mockStravaConnected = false
let mockIsStravaStatusLoading = false

jest.mock('@/src/apis/backendApi/hooks/weight/useWeightHistory', () => ({
  useWeightHistory: () => ({
    data: mockHistory,
    isLoading: mockIsLoading,
    refetch: jest.fn().mockResolvedValue(undefined),
  }),
}))

jest.mock('@/src/apis/backendApi/hooks/weight/useDeleteWeight', () => ({
  useDeleteWeight: () => ({ mutate: mockDeleteWeight }),
}))

jest.mock('@/src/apis/backendApi/hooks/activity/useActivities', () => ({
  useActivities: () => ({
    data: mockActivities,
    isLoading: mockIsActivitiesLoading,
    refetch: jest.fn().mockResolvedValue(undefined),
  }),
}))

jest.mock('@/src/apis/backendApi/hooks/strava/useStravaStatus', () => ({
  useStravaStatus: () => ({
    data: { connected: mockStravaConnected, athleteName: null, lastSyncedAt: null },
    isLoading: mockIsStravaStatusLoading,
    refetch: jest.fn().mockResolvedValue(undefined),
  }),
}))

// Dépend de useQueryClient() — testé isolément dans StravaConnectButton.test.tsx
jest.mock('@/src/features/tracking/StravaConnectButton', () => {
  const React = require('react')
  const { Text } = require('react-native')
  return {
    StravaConnectButton: () => React.createElement(Text, null, 'Connecter Strava'),
  }
})

// AvatarButton dépend de useNavigation (contexte expo-router absent en test unitaire)
jest.mock('@/src/components/avatar-button', () => ({
  AvatarButton: () => null,
}))

jest.mock('react-native-svg', () => {
  const React = require('react')
  const { View, Text: RNText } = require('react-native')
  const viewMock = (name: string) => {
    const C = ({ children }: any) => React.createElement(View, null, children)
    C.displayName = name
    return C
  }
  const SvgText = ({ children }: any) => React.createElement(RNText, null, children)
  SvgText.displayName = 'SvgText'
  return {
    __esModule: true,
    default: viewMock('Svg'),
    Circle: viewMock('Circle'),
    Defs: viewMock('Defs'),
    Line: viewMock('Line'),
    LinearGradient: viewMock('LinearGradient'),
    Path: viewMock('Path'),
    Polygon: viewMock('Polygon'),
    Stop: viewMock('Stop'),
    Text: SvgText,
  }
})

const makeEntry = (overrides: Partial<WeightEntry> = {}): WeightEntry => ({
  id: '1',
  measuredAt: '2026-06-25T07:00:00.000Z',
  weight: 75.5,
  bmi: null,
  bodyfat: null,
  water: null,
  muscle: null,
  bone: null,
  bmr: null,
  protein: null,
  bodyAge: null,
  heartRate: null,
  ...overrides,
})

function renderWithStore(ui: React.ReactElement, store = createStore()) {
  return render(<Provider store={store}>{ui}</Provider>)
}

const makeActivity = (overrides: Partial<StravaActivity> = {}): StravaActivity => ({
  id: 'act-1',
  name: 'Sortie VTT',
  type: 'MountainBikeRide',
  startedAt: '2026-07-01T08:00:00.000Z',
  distance: 15000.5,
  movingTime: 3600,
  elapsedTime: 3700,
  totalElevationGain: 420,
  calories: 870.2,
  ...overrides,
})

beforeEach(() => {
  mockHistory = []
  mockIsLoading = false
  mockActivities = []
  mockIsActivitiesLoading = false
  mockStravaConnected = false
  mockIsStravaStatusLoading = false
  mockDeleteWeight.mockClear()
})

afterEach(cleanup)

describe('TrackingScreen', () => {
  it('affiche le titre Suivi', async () => {
    const { getByText } = await renderWithStore(<TrackingScreen />)
    expect(getByText('Suivi')).toBeTruthy()
  })

  it("affiche l'état vide quand aucune pesée n'est synchronisée", async () => {
    const { getByText } = await renderWithStore(<TrackingScreen />)
    expect(getByText(/Aucune pesée synchronisée/i)).toBeTruthy()
  })

  it('affiche un indicateur de chargement', async () => {
    mockIsLoading = true
    const { getByTestId } = await renderWithStore(<TrackingScreen />)
    expect(getByTestId('loading-indicator')).toBeTruthy()
  })

  it('affiche le poids de la dernière pesée', async () => {
    mockHistory = [makeEntry({ weight: 74.2 })]
    const { getByText } = await renderWithStore(<TrackingScreen />)
    expect(getByText('74.2')).toBeTruthy()
  })

  it('affiche le badge de tendance quand il y a des pesées', async () => {
    mockHistory = [makeEntry({ weight: 75.0 })]
    const { getByText } = await renderWithStore(<TrackingScreen />)
    expect(getByText(/Stable|En hausse|En baisse/)).toBeTruthy()
  })

  it('affiche "En baisse" quand le poids a diminué de plus de 0.2kg', async () => {
    mockHistory = [
      makeEntry({ id: '1', measuredAt: '2026-06-24T07:00:00.000Z', weight: 76.0 }),
      makeEntry({ id: '2', measuredAt: '2026-06-25T07:00:00.000Z', weight: 75.5 }),
    ]
    const { getByText } = await renderWithStore(<TrackingScreen />)
    expect(getByText('En baisse')).toBeTruthy()
  })

  it('affiche "En hausse" quand le poids a augmenté de plus de 0.2kg', async () => {
    mockHistory = [
      makeEntry({ id: '1', measuredAt: '2026-06-24T07:00:00.000Z', weight: 75.0 }),
      makeEntry({ id: '2', measuredAt: '2026-06-25T07:00:00.000Z', weight: 75.5 }),
    ]
    const { getByText } = await renderWithStore(<TrackingScreen />)
    expect(getByText('En hausse')).toBeTruthy()
  })

  it("affiche le nombre de kg restants vers l'objectif", async () => {
    mockHistory = [makeEntry({ weight: 75.0 })]
    const store = createStore()
    store.set(onboardingAtom, {
      completed: true,
      firstName: 'Christophe',
      age: 43,
      sex: 'male',
      height: 178,
      activityLevel: 'moderate',
      stravaConnected: false,
      currentWeight: 75.0,
      targetWeight: 70.0,
      weeklyLossKg: 0.5,
    })

    const { getByText } = await renderWithStore(<TrackingScreen />, store)
    expect(getByText('5.0')).toBeTruthy()
    expect(getByText('Reste à perdre')).toBeTruthy()
  })

  it('appelle deleteWeight avec le bon id en appuyant sur la corbeille', async () => {
    mockHistory = [makeEntry({ id: 'entry-1', weight: 75.5 })]

    const { getByTestId } = await renderWithStore(<TrackingScreen />)
    await act(async () => {
      fireEvent.press(getByTestId('icon-trash-outline'))
    })
    expect(mockDeleteWeight).toHaveBeenCalledWith('entry-1')
  })

  it('affiche le bouton de connexion Strava quand aucun compte n’est connecté', async () => {
    mockStravaConnected = false
    const { getByText } = await renderWithStore(<TrackingScreen />)
    expect(getByText('Connecter Strava')).toBeTruthy()
  })

  it('affiche l’état vide des activités quand connecté sans historique', async () => {
    mockStravaConnected = true
    mockActivities = []
    const { getByText, queryByText } = await renderWithStore(<TrackingScreen />)
    expect(getByText(/Aucune activité synchronisée/i)).toBeTruthy()
    expect(queryByText('Connecter Strava')).toBeNull()
  })

  it('affiche les activités Strava synchronisées', async () => {
    mockStravaConnected = true
    mockActivities = [makeActivity({ name: 'Sortie VTT' })]
    const { getByText } = await renderWithStore(<TrackingScreen />)
    expect(getByText('Sortie VTT')).toBeTruthy()
    expect(getByText('15.0 km')).toBeTruthy()
    expect(getByText('1h00')).toBeTruthy()
    expect(getByText('420 m D+')).toBeTruthy()
    expect(getByText('870 kcal')).toBeTruthy()
  })

  it("limite l'historique des pesées à 3 entrées, en révèle 5 de plus par appui, et Voir moins réduit symétriquement par 5", async () => {
    // 9 pesées, une par jour du 16 au 24 juin — triées de la plus récente (24) à la plus ancienne (16)
    mockHistory = Array.from({ length: 9 }, (_, i) =>
      makeEntry({
        id: String(i + 1),
        measuredAt: `2026-06-${(16 + i).toString().padStart(2, '0')}T07:00:00.000Z`,
        weight: 80 - i * 0.5,
      }),
    )
    const { getByText, queryByText } = await renderWithStore(<TrackingScreen />)
    // Les 3 plus récentes (24, 23, 22 juin → poids 76.0, 76.5, 77.0)
    expect(getByText('77.0 kg')).toBeTruthy()
    expect(queryByText('77.5 kg')).toBeNull()
    // Pas encore de "Voir moins" : on est déjà à l'aperçu initial
    expect(queryByText('Voir moins')).toBeNull()

    // 1er appui sur "Voir plus" : +5 → 8 entrées visibles, la plus ancienne (16 juin, 80.0kg) reste cachée
    await act(async () => {
      fireEvent.press(getByText('Voir plus'))
    })
    expect(getByText('77.5 kg')).toBeTruthy()
    expect(getByText('78.0 kg')).toBeTruthy()
    expect(getByText('79.5 kg')).toBeTruthy()
    expect(queryByText('80.0 kg')).toBeNull()

    // 2e appui : les 9 entrées sont affichées, "Voir plus" disparaît
    await act(async () => {
      fireEvent.press(getByText('Voir plus'))
    })
    expect(getByText('80.0 kg')).toBeTruthy()
    expect(queryByText('Voir plus')).toBeNull()
    expect(getByText('Voir moins')).toBeTruthy()

    // 1er appui sur "Voir moins" : -5 → 4 entrées visibles (pas un retour direct à 3)
    await act(async () => {
      fireEvent.press(getByText('Voir moins'))
    })
    expect(getByText('77.5 kg')).toBeTruthy()
    expect(queryByText('78.0 kg')).toBeNull()

    // 2e appui sur "Voir moins" : retour à l'aperçu initial de 3, le bouton disparaît
    await act(async () => {
      fireEvent.press(getByText('Voir moins'))
    })
    expect(queryByText('77.5 kg')).toBeNull()
    expect(getByText('77.0 kg')).toBeTruthy()
    expect(queryByText('Voir moins')).toBeNull()
  })

  it('limite les activités à 3 et affiche le reste via Voir plus', async () => {
    mockStravaConnected = true
    mockActivities = [
      makeActivity({ id: 'act-1', name: 'Sortie 1' }),
      makeActivity({ id: 'act-2', name: 'Sortie 2' }),
      makeActivity({ id: 'act-3', name: 'Sortie 3' }),
      makeActivity({ id: 'act-4', name: 'Sortie 4' }),
    ]
    const { getByText, queryByText } = await renderWithStore(<TrackingScreen />)
    expect(getByText('Sortie 3')).toBeTruthy()
    expect(queryByText('Sortie 4')).toBeNull()

    await act(async () => {
      fireEvent.press(getByText('Voir plus'))
    })
    expect(getByText('Sortie 4')).toBeTruthy()
  })
})
