import { useRouter } from 'expo-router'
import { useAtom } from 'jotai'
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import tw from 'twrnc'

import { Button } from '@/src/components/button'
import { OnboardingProgress } from '@/src/components/onboarding-progress'
import { ScrollView } from '@/src/components/scroll-view'
import { Text } from '@/src/components/text'
import { useColors } from '@/src/hooks/use-colors'
import { type ActivityLevel } from '@/src/models/user/user.model'
import { onboardingAtom } from '@/src/store/onboardingAtom'

const LEVELS: { value: ActivityLevel; label: string; description: string }[] = [
  {
    value: 'sedentary',
    label: 'Sédentaire',
    description: 'Travail de bureau, peu de déplacements',
  },
  {
    value: 'light',
    label: 'Légèrement actif',
    description: 'Petites marches, tâches ménagères légères',
  },
  {
    value: 'moderate',
    label: 'Modérément actif',
    description: 'Marche régulière, debout une bonne partie de la journée',
  },
  {
    value: 'active',
    label: 'Très actif',
    description: 'Travail physique, beaucoup de mouvement au quotidien',
  },
  {
    value: 'very_active',
    label: 'Extrêmement actif',
    description: 'Sport intensif tous les jours, travail physique extrême',
  },
]

export default function OnboardingActivityScreen() {
  const c = useColors()
  const router = useRouter()
  const [onboarding, setOnboarding] = useAtom(onboardingAtom)
  const [selected, setSelected] = useState<ActivityLevel | null>(onboarding.activityLevel)
  const [error, setError] = useState(false)

  function onContinue() {
    if (!selected) {
      setError(true)
      return
    }
    setOnboarding((prev) => ({ ...prev, activityLevel: selected }))
    router.push('/onboarding/weight')
  }

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={tw`p-6 gap-8`} keyboardShouldPersistTaps="handled">
        <OnboardingProgress current={2} />

        <View style={tw`gap-2`}>
          <Text variant="heading1">{"Ton niveau d'activité"}</Text>
          <Text variant="body" color="secondary">
            Hors sport structuré — le sport se mesure via Strava.
          </Text>
        </View>

        <View style={tw`gap-2`}>
          {LEVELS.map((level) => {
            const isSelected = selected === level.value
            return (
              <Pressable
                key={level.value}
                onPress={() => {
                  setSelected(level.value)
                  setError(false)
                }}
                style={[
                  tw`p-4 rounded-2xl gap-1`,
                  {
                    borderWidth: 1.5,
                    borderColor: isSelected ? c.primary : c.border,
                    backgroundColor: isSelected ? `${c.primary}12` : c.surface,
                  },
                ]}
              >
                <Text variant="heading3" style={{ color: isSelected ? c.primary : c.textPrimary }}>
                  {level.label}
                </Text>
                <Text variant="caption" color="secondary">
                  {level.description}
                </Text>
              </Pressable>
            )
          })}
          {error && (
            <Text variant="caption" color="danger">
              {"Sélectionne ton niveau d'activité"}
            </Text>
          )}
        </View>

        <View style={tw`gap-2`}>
          <Button label="Retour" variant="secondary" fullWidth size="lg" onPress={router.back} />
          <Button label="Continuer" fullWidth size="lg" onPress={onContinue} />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
