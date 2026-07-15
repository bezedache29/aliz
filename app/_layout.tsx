import dayjs from '@/src/config/dayjs'
import '@/src/config/reactotron'

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import * as ExpoSplash from 'expo-splash-screen'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as WebBrowser from 'expo-web-browser'
import { useAtom, useSetAtom } from 'jotai'
import { Component, useEffect, useState, type ErrorInfo, type ReactNode } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import 'react-native-reanimated'

import { useProfile } from '@/src/apis/backendApi/hooks/profile/useProfile'
import { useWeightSync } from '@/src/apis/backendApi/hooks/weight/useWeightSync'
import { profileToOnboardingData } from '@/src/apis/backendApi/mappers/profile/profile.mapper'
import { CustomSplash } from '@/src/components/custom-splash'
import { useColorScheme } from '@/src/hooks/use-color-scheme'
import { useExpiringSoonCount } from '@/src/hooks/use-expiring-soon-count'
import { onboardingAtom } from '@/src/store/onboardingAtom'
import { notificationPermissionGrantedAtom } from '@/src/store/notificationPermissionAtom'
import { notificationsAtom } from '@/src/store/notificationsAtom'
import {
  cancelDailyAppReminder,
  ensureNotificationChannelAsync,
  presentExpiringStockNotification,
  requestNotificationPermissionsAsync,
  scheduleDailyAppReminder,
} from '@/src/utils/notifications'

function WeightSync() {
  const { mutate: sync } = useWeightSync()

  useEffect(() => {
    sync()
  }, [sync])

  return null
}

function ProfileSync() {
  const { data: profile } = useProfile()
  const setOnboarding = useSetAtom(onboardingAtom)

  useEffect(() => {
    if (!profile) return
    setOnboarding((prev) => {
      if (prev.completed) return prev
      return { ...prev, ...profileToOnboardingData(profile) }
    })
  }, [profile, setOnboarding])

  return null
}

function NotificationsSync() {
  const [notifState, setNotifState] = useAtom(notificationsAtom)
  const [permissionGranted, setPermissionGranted] = useAtom(notificationPermissionGrantedAtom)
  const expiringSoonCount = useExpiringSoonCount()
  const { enabled, appReminderEnabled, expiringStockEnabled } = notifState

  useEffect(() => {
    setNotifState((prev) => ({ ...prev, lastOpenDate: dayjs().format('YYYY-MM-DD') }))
  }, [setNotifState])

  useEffect(() => {
    async function setup() {
      // Vérifiée à chaque lancement, que les rappels soient actifs ou non, pour que
      // l'écran Paramètres reflète toujours l'état réel de la permission système.
      const granted = await requestNotificationPermissionsAsync()
      setPermissionGranted(granted)

      if (!enabled || !appReminderEnabled || !granted) {
        await cancelDailyAppReminder()
        return
      }
      await ensureNotificationChannelAsync()
      await scheduleDailyAppReminder()
    }
    setup()
  }, [enabled, appReminderEnabled, setPermissionGranted])

  useEffect(() => {
    if (!enabled || !expiringStockEnabled || !permissionGranted) return
    const today = dayjs().format('YYYY-MM-DD')
    if (expiringSoonCount > 0 && notifState.lastExpiryNotifiedDate !== today) {
      presentExpiringStockNotification(expiringSoonCount)
      setNotifState((prev) => ({ ...prev, lastExpiryNotifiedDate: today }))
    }
  }, [
    enabled,
    expiringStockEnabled,
    permissionGranted,
    expiringSoonCount,
    notifState.lastExpiryNotifiedDate,
    setNotifState,
  ])

  return null
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
})

ExpoSplash.preventAutoHideAsync()
WebBrowser.maybeCompleteAuthSession()

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (__DEV__) {
      console.error(error.message, info.componentStack)
    }
  }

  render() {
    const { error } = this.state
    if (error) {
      return (
        <ScrollView contentContainerStyle={{ flex: 1, padding: 24, paddingTop: 80 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#EF4444', marginBottom: 8 }}>
            Render Error
          </Text>
          <Text style={{ fontFamily: 'monospace', fontSize: 13, color: '#334155' }}>
            {(error as Error).message}
          </Text>
          <View style={{ marginTop: 16, height: 1, backgroundColor: '#E2E8F0' }} />
          <Text style={{ marginTop: 16, fontSize: 11, color: '#94A3B8' }}>
            {(error as Error).stack}
          </Text>
        </ScrollView>
      )
    }
    return this.props.children
  }
}

export const unstable_settings = {
  anchor: '(drawer)',
}

export default function RootLayout() {
  const colorScheme = useColorScheme()
  const [splashVisible, setSplashVisible] = useState(true)

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <BottomSheetModalProvider>
              <ProfileSync />
              <WeightSync />
              <NotificationsSync />
              <Stack>
                <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
                <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                <Stack.Screen name="food-search" options={{ headerShown: false }} />
                <Stack.Screen name="recipe-search" options={{ headerShown: false }} />
                <Stack.Screen name="recipe-create" options={{ headerShown: false }} />
                <Stack.Screen name="recipe-edit" options={{ headerShown: false }} />
                <Stack.Screen name="recipe-generate" options={{ headerShown: false }} />
                <Stack.Screen name="provision-add" options={{ headerShown: false }} />
                <Stack.Screen name="goal-edit" options={{ headerShown: false }} />
              </Stack>
              <StatusBar style="auto" />
            </BottomSheetModalProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </QueryClientProvider>
      {splashVisible && <CustomSplash onFinished={() => setSplashVisible(false)} />}
    </GestureHandlerRootView>
  )
}
