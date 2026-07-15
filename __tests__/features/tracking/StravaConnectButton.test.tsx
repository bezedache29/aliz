import { act, fireEvent, render, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as WebBrowser from 'expo-web-browser'
import React from 'react'
import { ToastAndroid } from 'react-native'

import { StravaConnectButton } from '@/src/features/tracking/StravaConnectButton'

jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: jest.fn(),
}))
const mockedOpenAuthSessionAsync = WebBrowser.openAuthSessionAsync as jest.Mock

const mockedMutate = jest.fn()
jest.mock('@/src/apis/backendApi/hooks/activity/useActivitySync', () => ({
  useActivitySync: () => ({ mutate: mockedMutate }),
}))

jest.mock('@/src/hooks/use-colors', () => ({
  useColors: () => ({
    background: '#fff',
    surface: '#fff',
    surfaceElevated: '#f1f5f9',
    border: '#e2e8f0',
    textPrimary: '#020617',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
    primary: '#16a34a',
    primaryLight: '#22c55e',
    danger: '#dc2626',
    warning: '#d97706',
    info: '#3b82f6',
    tertiary: '#8b5cf6',
  }),
}))

afterEach(() => {
  jest.clearAllMocks()
})

function renderButton() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    React.createElement(QueryClientProvider, { client: queryClient }, <StravaConnectButton />),
  )
}

describe('StravaConnectButton', () => {
  it('affiche le bouton de connexion', async () => {
    const { getByLabelText } = await renderButton()
    expect(getByLabelText('Connecter Strava')).toBeTruthy()
  })

  it("ouvre la session d'autorisation Strava avec le bon callback au clic", async () => {
    mockedOpenAuthSessionAsync.mockResolvedValueOnce({ type: 'dismiss' })
    const { getByLabelText } = await renderButton()
    await act(async () => {
      fireEvent.press(getByLabelText('Connecter Strava'))
    })
    expect(mockedOpenAuthSessionAsync).toHaveBeenCalledWith(
      expect.stringContaining('/strava/authorize'),
      'aliz://strava-callback',
    )
  })

  it('déclenche la synchronisation quand la connexion réussit', async () => {
    mockedOpenAuthSessionAsync.mockResolvedValueOnce({
      type: 'success',
      url: 'aliz://strava-callback?connected=1',
    })
    const { getByLabelText } = await renderButton()
    await act(async () => {
      fireEvent.press(getByLabelText('Connecter Strava'))
    })
    await waitFor(() => expect(mockedMutate).toHaveBeenCalled())
  })

  it("ne déclenche pas la synchronisation si l'utilisateur annule", async () => {
    mockedOpenAuthSessionAsync.mockResolvedValueOnce({ type: 'dismiss' })
    const { getByLabelText } = await renderButton()
    await act(async () => {
      fireEvent.press(getByLabelText('Connecter Strava'))
    })
    expect(mockedMutate).not.toHaveBeenCalled()
  })

  it("ne déclenche pas la synchronisation si le retour n'indique pas connected=1", async () => {
    mockedOpenAuthSessionAsync.mockResolvedValueOnce({
      type: 'success',
      url: 'aliz://strava-callback?error=1',
    })
    const { getByLabelText } = await renderButton()
    await act(async () => {
      fireEvent.press(getByLabelText('Connecter Strava'))
    })
    expect(mockedMutate).not.toHaveBeenCalled()
  })

  it("affiche un toast d'erreur si l'ouverture de la session Strava échoue", async () => {
    const toastSpy = jest.spyOn(ToastAndroid, 'show').mockImplementation(() => {})
    mockedOpenAuthSessionAsync.mockRejectedValueOnce(new Error('network error'))
    const { getByLabelText } = await renderButton()
    await act(async () => {
      fireEvent.press(getByLabelText('Connecter Strava'))
    })
    expect(toastSpy).toHaveBeenCalledWith('Impossible de contacter Strava', ToastAndroid.SHORT)
    toastSpy.mockRestore()
  })
})
