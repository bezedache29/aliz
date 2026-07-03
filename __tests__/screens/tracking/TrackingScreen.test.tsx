import { act, cleanup, fireEvent, render } from '@testing-library/react-native'
import { createStore, Provider } from 'jotai'
import React from 'react'

import TrackingScreen from '@/src/screens/tracking/TrackingScreen'
import { onboardingAtom } from '@/src/store/onboardingAtom'
import { type WeightEntry } from '@/src/models/weight/weight.model'

// Mock des hooks React Query — remplacent l'appel réseau
const mockDeleteWeight = jest.fn()
let mockHistory: WeightEntry[] = []
let mockIsLoading = false

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

beforeEach(() => {
  mockHistory = []
  mockIsLoading = false
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
})
