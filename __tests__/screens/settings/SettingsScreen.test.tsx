import { act, cleanup, fireEvent, render } from '@testing-library/react-native'
import React from 'react'

import SettingsScreen from '@/src/screens/settings/SettingsScreen'

const mockDisconnectStrava = jest.fn()
let mockStravaStatus: { connected: boolean; athleteName: string | null } | undefined = {
  connected: false,
  athleteName: null,
}
let mockIsLoading = false
let mockIsDisconnecting = false

jest.mock('@/src/apis/backendApi/hooks/strava/useStravaStatus', () => ({
  useStravaStatus: () => ({
    data: mockStravaStatus,
    isLoading: mockIsLoading,
    refetch: jest.fn().mockResolvedValue(undefined),
  }),
}))

jest.mock('@/src/apis/backendApi/hooks/strava/useStravaDisconnect', () => ({
  useStravaDisconnect: () => ({ mutate: mockDisconnectStrava, isPending: mockIsDisconnecting }),
}))

// Dépend de useQueryClient() — testé isolément dans StravaConnectButton.test.tsx
jest.mock('@/src/features/tracking/StravaConnectButton', () => {
  const React = require('react')
  const { Text } = require('react-native')
  return {
    StravaConnectButton: () => React.createElement(Text, null, 'Connecter Strava'),
  }
})

beforeEach(() => {
  mockStravaStatus = { connected: false, athleteName: null }
  mockIsLoading = false
  mockIsDisconnecting = false
  mockDisconnectStrava.mockClear()
})

afterEach(cleanup)

describe('SettingsScreen', () => {
  it('affiche le titre Paramètres', async () => {
    const { getByText } = await render(<SettingsScreen />)
    expect(getByText('Paramètres')).toBeTruthy()
  })

  it('affiche le bouton de connexion quand aucun compte Strava n’est connecté', async () => {
    const { getByText } = await render(<SettingsScreen />)
    expect(getByText('Connecter Strava')).toBeTruthy()
  })

  it('affiche le nom du compte connecté et le bouton de déconnexion', async () => {
    mockStravaStatus = { connected: true, athleteName: 'Christophe Salou' }
    const { getByText, getByLabelText, queryByText } = await render(<SettingsScreen />)
    expect(getByText(/Christophe Salou/)).toBeTruthy()
    // Bouton icône seule — le libellé n'est exposé que via accessibilityLabel
    expect(getByLabelText('Déconnecter Strava')).toBeTruthy()
    expect(queryByText('Connecter Strava')).toBeNull()
  })

  it('appelle disconnectStrava au clic sur le bouton de déconnexion', async () => {
    mockStravaStatus = { connected: true, athleteName: 'Christophe Salou' }
    const { getByLabelText } = await render(<SettingsScreen />)
    await act(async () => {
      fireEvent.press(getByLabelText('Déconnecter Strava'))
    })
    expect(mockDisconnectStrava).toHaveBeenCalled()
  })
})
