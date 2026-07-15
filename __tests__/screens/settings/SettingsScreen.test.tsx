import { act, cleanup, fireEvent, render } from '@testing-library/react-native'
import { createStore, Provider } from 'jotai'
import React from 'react'
import { Linking } from 'react-native'

import SettingsScreen from '@/src/screens/settings/SettingsScreen'
import { mmkv } from '@/src/store/mmkv'
import { notificationPermissionGrantedAtom } from '@/src/store/notificationPermissionAtom'
import { notificationsAtom } from '@/src/store/notificationsAtom'

const mockRequestPermissions = jest.fn()
jest.mock('@/src/utils/notifications', () => ({
  requestNotificationPermissionsAsync: () => mockRequestPermissions(),
}))

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

afterEach(() => {
  cleanup()
  mmkv.remove('notifications_v1')
})

function renderWithStore(ui: React.ReactElement, store = createStore()) {
  return render(<Provider store={store}>{ui}</Provider>)
}

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

describe('SettingsScreen — notifications', () => {
  it('affiche les 3 interrupteurs activés par défaut', async () => {
    const { getAllByRole } = await renderWithStore(<SettingsScreen />)
    const switches = getAllByRole('switch')
    expect(switches).toHaveLength(3)
    switches.forEach((s) => expect(s.props.value).toBe(true))
  })

  it('coupe le switch global et met à jour le store', async () => {
    const store = createStore()
    const { getAllByRole } = await renderWithStore(<SettingsScreen />, store)
    const [globalSwitch] = getAllByRole('switch')
    await act(async () => {
      fireEvent(globalSwitch, 'valueChange', false)
    })
    expect(store.get(notificationsAtom).enabled).toBe(false)
  })

  it('coupe uniquement le rappel quotidien sans toucher aux autres réglages', async () => {
    const store = createStore()
    const { getAllByRole } = await renderWithStore(<SettingsScreen />, store)
    const [, appReminderSwitch] = getAllByRole('switch')
    await act(async () => {
      fireEvent(appReminderSwitch, 'valueChange', false)
    })
    const state = store.get(notificationsAtom)
    expect(state.appReminderEnabled).toBe(false)
    expect(state.enabled).toBe(true)
    expect(state.expiringStockEnabled).toBe(true)
  })

  it('coupe uniquement les notifs de provisions expirantes', async () => {
    const store = createStore()
    const { getAllByRole } = await renderWithStore(<SettingsScreen />, store)
    const [, , expiringStockSwitch] = getAllByRole('switch')
    await act(async () => {
      fireEvent(expiringStockSwitch, 'valueChange', false)
    })
    const state = store.get(notificationsAtom)
    expect(state.expiringStockEnabled).toBe(false)
    expect(state.enabled).toBe(true)
    expect(state.appReminderEnabled).toBe(true)
  })
})

describe('SettingsScreen — synchronisation avec la permission OS', () => {
  beforeEach(() => {
    mockRequestPermissions.mockReset()
    jest.spyOn(Linking, 'openSettings').mockImplementation(() => Promise.resolve())
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("affiche le switch éteint et le bandeau quand l'OS a refusé la permission", async () => {
    const store = createStore()
    store.set(notificationPermissionGrantedAtom, false)
    const { getAllByRole, getByText } = await renderWithStore(<SettingsScreen />, store)
    const [globalSwitch] = getAllByRole('switch')
    expect(globalSwitch.props.value).toBe(false)
    expect(getByText('Désactivées dans les réglages du téléphone.')).toBeTruthy()
  })

  it("ouvre les réglages système sans activer si l'OS refuse toujours la permission", async () => {
    mockRequestPermissions.mockResolvedValue(false)
    const store = createStore()
    store.set(notificationsAtom, {
      lastOpenDate: null,
      lastExpiryNotifiedDate: null,
      enabled: false,
      appReminderEnabled: true,
      expiringStockEnabled: true,
    })
    store.set(notificationPermissionGrantedAtom, false)
    const { getAllByRole } = await renderWithStore(<SettingsScreen />, store)
    const [globalSwitch] = getAllByRole('switch')
    await act(async () => {
      fireEvent(globalSwitch, 'valueChange', true)
    })
    expect(Linking.openSettings).toHaveBeenCalled()
    expect(store.get(notificationsAtom).enabled).toBe(false)
  })

  it("active les notifications et fait disparaître le bandeau si l'OS accorde la permission", async () => {
    mockRequestPermissions.mockResolvedValue(true)
    const store = createStore()
    store.set(notificationPermissionGrantedAtom, false)
    const { getAllByRole, getByText, queryByText } = await renderWithStore(
      <SettingsScreen />,
      store,
    )
    expect(getByText('Désactivées dans les réglages du téléphone.')).toBeTruthy()
    const [globalSwitch] = getAllByRole('switch')
    await act(async () => {
      fireEvent(globalSwitch, 'valueChange', true)
    })
    expect(store.get(notificationsAtom).enabled).toBe(true)
    expect(queryByText('Désactivées dans les réglages du téléphone.')).toBeNull()
  })
})
