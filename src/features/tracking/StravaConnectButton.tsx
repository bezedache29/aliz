import { useQueryClient } from '@tanstack/react-query'
import * as WebBrowser from 'expo-web-browser'
import { useState } from 'react'
import { ToastAndroid } from 'react-native'

import { useActivitySync } from '@/src/apis/backendApi/hooks/activity/useActivitySync'
import { Button } from '@/src/components/button'

const STRAVA_REDIRECT_URL = 'aliz://strava-callback'

export function StravaConnectButton({ fullWidth }: { fullWidth?: boolean }) {
  const [connecting, setConnecting] = useState(false)
  const queryClient = useQueryClient()
  const { mutate: syncActivities } = useActivitySync()

  async function connect() {
    setConnecting(true)
    try {
      const result = await WebBrowser.openAuthSessionAsync(
        `${process.env.EXPO_PUBLIC_API_URL}/strava/authorize`,
        STRAVA_REDIRECT_URL,
      )

      if (result.type === 'success' && result.url.includes('connected=1')) {
        queryClient.invalidateQueries({ queryKey: ['strava-status'] })
        syncActivities()
      } else if (result.type === 'success') {
        ToastAndroid.show('Connexion Strava annulée', ToastAndroid.SHORT)
      }
    } finally {
      setConnecting(false)
    }
  }

  return (
    <Button
      label="Connecter Strava"
      variant="primary"
      size="md"
      icon="log-in-outline"
      iconOnly
      fullWidth={fullWidth}
      loading={connecting}
      onPress={connect}
    />
  )
}
