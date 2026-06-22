import { SafeAreaView } from 'react-native-safe-area-context'

import { Text } from '@/src/components/text'
import { useColors } from '@/src/hooks/use-colors'

export default function OnboardingActivityScreen() {
  const c = useColors()

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background, padding: 24 }}>
      <Text variant="heading1">Étape 2 — Activité de base</Text>
      <Text variant="body" color="secondary">
        {"Niveau d'activité hors sport structuré"}
      </Text>
    </SafeAreaView>
  )
}
