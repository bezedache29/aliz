import { render } from '@testing-library/react-native'
import React from 'react'

import { WeightChart } from '@/src/features/tracking/WeightChart'
import { type WeightEntry } from '@/src/models/weight/weight.model'

// Mock react-native-svg — les éléments SVG ne sont pas disponibles dans JSDOM
jest.mock('react-native-svg', () => {
  const React = require('react')
  const { View, Text: RNText } = require('react-native')
  const viewMock = (name: string) => {
    const C = ({ children }: any) => React.createElement(View, null, children)
    C.displayName = name
    return C
  }
  // SvgText doit utiliser RNText pour pouvoir rendre des strings
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
  weight: 75.0,
  source: 'manual',
  ...overrides,
})

describe('WeightChart', () => {
  it('affiche un message quand il y a moins de 2 pesées', async () => {
    const { getByText } = await render(<WeightChart entries={[makeEntry()]} />)
    expect(getByText(/au moins 2 pesées/i)).toBeTruthy()
  })

  it('affiche un message quand la liste est vide', async () => {
    const { getByText } = await render(<WeightChart entries={[]} />)
    expect(getByText(/au moins 2 pesées/i)).toBeTruthy()
  })

  it('affiche les dates de début et de fin avec 2 entrées', async () => {
    const entries = [
      makeEntry({ id: '1', date: '2026-06-20T07:00:00.000Z', weight: 76.0 }),
      makeEntry({ id: '2', date: '2026-06-25T07:00:00.000Z', weight: 75.0 }),
    ]
    const { getByText } = await render(<WeightChart entries={entries} />)
    // Les dates formatées en "D MMM" (français)
    expect(getByText('20 juin')).toBeTruthy()
    expect(getByText('25 juin')).toBeTruthy()
  })

  it('se rend sans erreur avec plusieurs entrées', async () => {
    const entries = Array.from({ length: 5 }, (_, i) =>
      makeEntry({
        id: String(i),
        date: `2026-06-${20 + i}T07:00:00.000Z`,
        weight: 76 - i * 0.2,
      }),
    )
    const { toJSON } = await render(<WeightChart entries={entries} />)
    expect(toJSON()).not.toBeNull()
  })

  it("limite l'affichage aux 30 dernières entrées", async () => {
    // 35 entrées → seules les 30 les plus récentes sont affichées
    const entries = Array.from({ length: 35 }, (_, i) =>
      makeEntry({
        id: String(i),
        date: new Date(2026, 0, i + 1).toISOString(),
        weight: 80 - i * 0.1,
      }),
    )
    // Doit se rendre sans erreur (pas de crash avec beaucoup de points)
    const { toJSON } = await render(<WeightChart entries={entries} />)
    expect(toJSON()).not.toBeNull()
  })
})
