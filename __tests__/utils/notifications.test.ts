import * as Notifications from 'expo-notifications'

import { mmkv } from '@/src/store/mmkv'
import {
  APP_REMINDER_IDENTIFIER,
  cancelDailyAppReminder,
  ensureNotificationChannelAsync,
  presentExpiringStockNotification,
  requestNotificationPermissionsAsync,
  scheduleDailyAppReminder,
} from '@/src/utils/notifications'

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  AndroidImportance: { DEFAULT: 3 },
  SchedulableTriggerInputTypes: { DAILY: 'daily' },
}))

const mockedNotifications = Notifications as jest.Mocked<typeof Notifications>

// Capturé une seule fois : setNotificationHandler n'est appelé qu'à l'import du module,
// et jest.clearAllMocks() efface ensuite l'historique d'appels de ce mock entre les tests.
const handleNotification =
  mockedNotifications.setNotificationHandler.mock.calls[0]![0]!.handleNotification

// Date fixée au 2026-06-29 pour des assertions déterministes
const FIXED_NOW = new Date('2026-06-29T08:00:00Z').getTime()

function makeFakeNotification(identifier: string) {
  return {
    date: Date.now(),
    request: { identifier, content: {} as any, trigger: null },
  } as Notifications.Notification
}

beforeEach(() => {
  jest.useFakeTimers()
  jest.setSystemTime(FIXED_NOW)
})

afterEach(() => {
  jest.useRealTimers()
  jest.clearAllMocks()
  mmkv.remove('notifications_v1')
})

describe('requestNotificationPermissionsAsync', () => {
  it('retourne true sans redemander si déjà accordée', async () => {
    mockedNotifications.getPermissionsAsync.mockResolvedValueOnce({ granted: true } as any)
    const granted = await requestNotificationPermissionsAsync()
    expect(granted).toBe(true)
    expect(mockedNotifications.requestPermissionsAsync).not.toHaveBeenCalled()
  })

  it('demande la permission si pas encore accordée et retourne le résultat', async () => {
    mockedNotifications.getPermissionsAsync.mockResolvedValueOnce({ granted: false } as any)
    mockedNotifications.requestPermissionsAsync.mockResolvedValueOnce({ granted: true } as any)
    const granted = await requestNotificationPermissionsAsync()
    expect(granted).toBe(true)
    expect(mockedNotifications.requestPermissionsAsync).toHaveBeenCalled()
  })

  it("retourne false si l'utilisateur refuse", async () => {
    mockedNotifications.getPermissionsAsync.mockResolvedValueOnce({ granted: false } as any)
    mockedNotifications.requestPermissionsAsync.mockResolvedValueOnce({ granted: false } as any)
    const granted = await requestNotificationPermissionsAsync()
    expect(granted).toBe(false)
  })
})

describe('ensureNotificationChannelAsync', () => {
  it('crée le channel "reminders" avec une importance par défaut', async () => {
    await ensureNotificationChannelAsync()
    expect(mockedNotifications.setNotificationChannelAsync).toHaveBeenCalledWith(
      'reminders',
      expect.objectContaining({ name: 'Rappels', importance: 3 }),
    )
  })
})

describe('scheduleDailyAppReminder', () => {
  it('planifie une notif quotidienne à 12h avec l’identifiant du rappel', async () => {
    await scheduleDailyAppReminder()
    expect(mockedNotifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: APP_REMINDER_IDENTIFIER,
        trigger: expect.objectContaining({ type: 'daily', hour: 12, minute: 0 }),
      }),
    )
  })
})

describe('cancelDailyAppReminder', () => {
  it("annule la notif planifiée pour l'identifiant du rappel quotidien", async () => {
    await cancelDailyAppReminder()
    expect(mockedNotifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
      APP_REMINDER_IDENTIFIER,
    )
  })
})

describe('presentExpiringStockNotification', () => {
  it('utilise le singulier pour une seule provision', async () => {
    await presentExpiringStockNotification(1)
    expect(mockedNotifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          body: '1 provision arrive à expiration dans les 3 prochains jours.',
        }),
      }),
    )
  })

  it('utilise le pluriel pour plusieurs provisions', async () => {
    await presentExpiringStockNotification(3)
    expect(mockedNotifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          body: '3 provisions arrivent à expiration dans les 3 prochains jours.',
        }),
      }),
    )
  })
})

describe('handleNotification (rappel quotidien)', () => {
  it("affiche le rappel si l'app n'a pas été ouverte aujourd'hui", async () => {
    const behavior = await handleNotification(makeFakeNotification(APP_REMINDER_IDENTIFIER))
    expect(behavior.shouldShowBanner).toBe(true)
    expect(behavior.shouldShowList).toBe(true)
    expect(behavior.shouldPlaySound).toBe(true)
  })

  it("masque le rappel si l'app a déjà été ouverte aujourd'hui", async () => {
    mmkv.set(
      'notifications_v1',
      JSON.stringify({ lastOpenDate: '2026-06-29', lastExpiryNotifiedDate: null }),
    )
    const behavior = await handleNotification(makeFakeNotification(APP_REMINDER_IDENTIFIER))
    expect(behavior.shouldShowBanner).toBe(false)
    expect(behavior.shouldShowList).toBe(false)
    expect(behavior.shouldPlaySound).toBe(false)
  })

  it('affiche toujours les notifs qui ne sont pas le rappel quotidien', async () => {
    mmkv.set(
      'notifications_v1',
      JSON.stringify({ lastOpenDate: '2026-06-29', lastExpiryNotifiedDate: null }),
    )
    const behavior = await handleNotification(makeFakeNotification('some-other-notification'))
    expect(behavior.shouldShowBanner).toBe(true)
  })
})
