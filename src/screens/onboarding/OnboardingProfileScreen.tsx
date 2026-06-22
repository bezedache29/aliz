import { SafeAreaView } from 'react-native-safe-area-context'

import { Text } from '@/src/components/text'
import { useColors } from '@/src/hooks/use-colors'

export default function OnboardingProfileScreen() {
  const c = useColors()

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background, padding: 24 }}>
      <Text variant="heading1">Étape 1 — Profil</Text>
      <Text variant="body" color="secondary">
        Prénom, âge, sexe, taille
      </Text>
    </SafeAreaView>
  )
}
