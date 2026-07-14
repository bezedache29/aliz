import { render } from '@testing-library/react-native'
import React from 'react'

import { ActivityRow } from '@/src/features/tracking/ActivityRow'
import { type StravaActivity } from '@/src/models/activity/strava-activity.model'

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

describe('ActivityRow', () => {
  it("affiche le nom et le label français du type d'activité", async () => {
    const { getByText } = await render(<ActivityRow activity={makeActivity()} />)
    expect(getByText('Sortie VTT')).toBeTruthy()
    expect(getByText('VTT')).toBeTruthy()
  })

  it('affiche distance, durée, D+ et calories', async () => {
    const { getByText } = await render(<ActivityRow activity={makeActivity()} />)
    expect(getByText('15.0 km')).toBeTruthy()
    expect(getByText('1h00')).toBeTruthy()
    expect(getByText('420 m D+')).toBeTruthy()
    expect(getByText('870 kcal')).toBeTruthy()
  })

  it('inclut la date quand showDate est true (par défaut)', async () => {
    const { getByText } = await render(<ActivityRow activity={makeActivity()} />)
    expect(getByText('VTT')).toBeTruthy()
    expect(getByText('mercredi 1 juillet')).toBeTruthy()
  })

  it("n'affiche pas la date quand showDate est false", async () => {
    const { getByText, queryByText } = await render(
      <ActivityRow activity={makeActivity()} showDate={false} />,
    )
    expect(getByText('VTT')).toBeTruthy()
    expect(queryByText(/mercredi/)).toBeNull()
  })

  it('masque la ligne meta quand aucune donnée chiffrée n’est disponible', async () => {
    const activity = makeActivity({
      distance: null,
      movingTime: null,
      totalElevationGain: null,
      calories: null,
    })
    const { queryByText } = await render(<ActivityRow activity={activity} />)
    expect(queryByText(/km|min|h|D\+|kcal/)).toBeNull()
  })

  it('utilise un label brut pour un type inconnu', async () => {
    const { getByText } = await render(
      <ActivityRow activity={makeActivity({ type: 'Kayaking' })} />,
    )
    expect(getByText(/Kayaking/)).toBeTruthy()
  })
})
