import '@/src/config/dayjs'
import '@/src/config/reactotron'

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import * as ExpoSplash from 'expo-splash-screen'
import { Stack, useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useAtomValue } from 'jotai'
import { Component, useState, type ErrorInfo, type ReactNode } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import 'react-native-reanimated'

import { useColorScheme } from '@/src/hooks/use-color-scheme'
import SplashScreen from '@/src/screens/splash/SplashScreen'
import { onboardingAtom } from '@/src/store/onboardingAtom'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
})

ExpoSplash.preventAutoHideAsync()

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
  const router = useRouter()
  const onboarding = useAtomValue(onboardingAtom)
  const [showSplash, setShowSplash] = useState(true)

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <BottomSheetModalProvider>
              <Stack>
                <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
                <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                <Stack.Screen name="food-search" options={{ headerShown: false }} />
              </Stack>
              <StatusBar style="auto" />
              {showSplash && (
                <SplashScreen
                  onReady={() => {
                    ExpoSplash.hideAsync()
                    if (!onboarding.completed) {
                      router.replace('/onboarding')
                    }
                  }}
                  onFinish={() => setShowSplash(false)}
                />
              )}
            </BottomSheetModalProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </QueryClientProvider>
    </GestureHandlerRootView>
  )
}
