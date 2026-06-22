import { SafeAreaView } from 'react-native-safe-area-context'

import { Text } from '@/src/components/text'
import { useColors } from '@/src/hooks/use-colors'

export default function OnboardingGoalScreen() {
  const c = useColors()

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background, padding: 24 }}>
      <Text variant="heading1">Étape 5 — Objectif</Text>
      <Text variant="body" color="secondary">
        Poids cible et calcul BMR / TDEE / macros
      </Text>
    </SafeAreaView>
  )
}
