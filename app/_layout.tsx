import '@/src/config/reactotron'

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { ScrollView, Text, View } from 'react-native'
import 'react-native-reanimated'

import { useColorScheme } from '@/hooks/use-color-scheme'

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
  anchor: '(tabs)',
}

export default function RootLayout() {
  const colorScheme = useColorScheme()

  return (
    <ErrorBoundary>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          <Stack.Screen
            name="design-system"
            options={{ title: 'Design System', headerBackTitle: 'Retour' }}
          />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </ErrorBoundary>
  )
}
