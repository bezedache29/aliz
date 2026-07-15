import * as Notifications from 'expo-notifications'
import { AndroidImportance, SchedulableTriggerInputTypes } from 'expo-notifications'

import dayjs from '@/src/config/dayjs'
import { mmkv } from '@/src/store/mmkv'
import type { NotificationsState } from '@/src/store/notificationsAtom'

const CHANNEL_ID = 'reminders'
const NOTIFICATIONS_STORAGE_KEY = 'notifications_v1'
export const APP_REMINDER_IDENTIFIER = 'daily-app-reminder'
const APP_REMINDER_HOUR = 12

function readLastOpenDate(): string | null {
  const raw = mmkv.getString(NOTIFICATIONS_STORAGE_KEY)
  if (!raw) return null
  try {
    return (JSON.parse(raw) as NotificationsState).lastOpenDate ?? null
  } catch {
    return null
  }
}

// Le handler n'est appelé que si l'app tourne encore (foreground ou background non tué) au moment
// du déclenchement — si l'app est totalement fermée, la notif s'affiche avec son contenu par défaut.
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const isAppReminder = notification.request.identifier === APP_REMINDER_IDENTIFIER
    const alreadyOpenedToday = isAppReminder && readLastOpenDate() === dayjs().format('YYYY-MM-DD')

    return {
      shouldShowBanner: !alreadyOpenedToday,
      shouldShowList: !alreadyOpenedToday,
      shouldPlaySound: !alreadyOpenedToday,
      shouldSetBadge: false,
    }
  },
})

export async function requestNotificationPermissionsAsync(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync()
  if (settings.granted) return true
  const request = await Notifications.requestPermissionsAsync()
  return request.granted
}

export async function ensureNotificationChannelAsync(): Promise<void> {
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Rappels',
    importance: AndroidImportance.DEFAULT,
  })
}

export async function scheduleDailyAppReminder(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    identifier: APP_REMINDER_IDENTIFIER,
    content: {
      title: 'Toujours là ?',
      body: "Tu n'as pas encore ouvert aliz aujourd'hui, un petit coup d'œil ?",
    },
    trigger: {
      type: SchedulableTriggerInputTypes.DAILY,
      hour: APP_REMINDER_HOUR,
      minute: 0,
      channelId: CHANNEL_ID,
    },
  })
}

export async function cancelDailyAppReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(APP_REMINDER_IDENTIFIER)
}

export async function presentExpiringStockNotification(count: number): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Provisions à surveiller',
      body:
        count === 1
          ? '1 provision arrive à expiration dans les 3 prochains jours.'
          : `${count} provisions arrivent à expiration dans les 3 prochains jours.`,
      data: { type: 'expiring-stock' },
    },
    trigger: { channelId: CHANNEL_ID },
  })
}
