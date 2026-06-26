import { act, cleanup, fireEvent, render } from '@testing-library/react-native'
import { createStore, Provider } from 'jotai'
import React from 'react'

import TrackingScreen from '@/src/screens/tracking/TrackingScreen'
import { onboardingAtom } from '@/src/store/onboardingAtom'
import { weightHistoryAtom } from '@/src/store/weightAtom'
import { type WeightEntry } from '@/src/models/weight/weight.model'

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
  }
})

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
  date: '2026-06-25T07:00:00.000Z',
  weight: 75.5,
  source: 'manual',
  ...overrides,
})

// Wrapper Jotai avec store personnalisable
function renderWithStore(ui: React.ReactElement, store = createStore()) {
  return render(<Provider store={store}>{ui}</Provider>)
}

afterEach(cleanup)

describe('TrackingScreen', () => {
  it('affiche le titre Suivi', async () => {
    const { getByText } = await renderWithStore(<TrackingScreen />)
    expect(getByText('Suivi')).toBeTruthy()
  })

  it("affiche l'état vide quand aucune pesée n'est enregistrée", async () => {
    const { getByText } = await renderWithStore(<TrackingScreen />)
    expect(getByText(/Aucune pesée enregistrée/i)).toBeTruthy()
  })

  it('affiche le poids de la dernière pesée', async () => {
    const store = createStore()
    store.set(weightHistoryAtom, [makeEntry({ weight: 74.2 })])

    const { getByText } = await renderWithStore(<TrackingScreen />, store)
    expect(getByText('74.2')).toBeTruthy()
  })

  it('affiche le badge de tendance quand il y a des pesées', async () => {
    const store = createStore()
    store.set(weightHistoryAtom, [makeEntry({ weight: 75.0 })])

    const { getByText } = await renderWithStore(<TrackingScreen />, store)
    // Badge tendance (Stable / En hausse / En baisse)
    expect(getByText(/Stable|En hausse|En baisse/)).toBeTruthy()
  })

  it('affiche "En baisse" quand le poids a diminué de plus de 0.2kg', async () => {
    const store = createStore()
    store.set(weightHistoryAtom, [
      makeEntry({ id: '1', date: '2026-06-24T07:00:00.000Z', weight: 76.0 }),
      makeEntry({ id: '2', date: '2026-06-25T07:00:00.000Z', weight: 75.5 }),
    ])

    const { getByText } = await renderWithStore(<TrackingScreen />, store)
    expect(getByText('En baisse')).toBeTruthy()
  })

  it('affiche "En hausse" quand le poids a augmenté de plus de 0.2kg', async () => {
    const store = createStore()
    store.set(weightHistoryAtom, [
      makeEntry({ id: '1', date: '2026-06-24T07:00:00.000Z', weight: 75.0 }),
      makeEntry({ id: '2', date: '2026-06-25T07:00:00.000Z', weight: 75.5 }),
    ])

    const { getByText } = await renderWithStore(<TrackingScreen />, store)
    expect(getByText('En hausse')).toBeTruthy()
  })

  it("affiche le nombre de kg restants vers l'objectif", async () => {
    const store = createStore()
    store.set(weightHistoryAtom, [makeEntry({ weight: 75.0 })])
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

  it("supprime une pesée de l'historique en appuyant sur la corbeille", async () => {
    const store = createStore()
    store.set(weightHistoryAtom, [
      makeEntry({ id: '1', weight: 75.5, date: '2026-06-25T07:00:00.000Z' }),
    ])

    await renderWithStore(<TrackingScreen />, store)
    await act(async () => {
      store.set(weightHistoryAtom, [])
    })
    expect(store.get(weightHistoryAtom)).toHaveLength(0)
  })
})
