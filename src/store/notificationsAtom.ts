import { atomWithMMKV } from './atomWithMMKV'

export interface NotificationsState {
  lastOpenDate: string | null
  lastExpiryNotifiedDate: string | null
  enabled: boolean
  appReminderEnabled: boolean
  expiringStockEnabled: boolean
}

const initial: NotificationsState = {
  lastOpenDate: null,
  lastExpiryNotifiedDate: null,
  enabled: true,
  appReminderEnabled: true,
  expiringStockEnabled: true,
}

export const notificationsAtom = atomWithMMKV<NotificationsState>('notifications_v1', initial)
