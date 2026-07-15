import { useRouter } from 'expo-router'
import { useAtom } from 'jotai'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import tw from 'twrnc'

import { useCreateProfile } from '@/src/apis/backendApi/hooks/profile/useCreateProfile'
import { useProfile } from '@/src/apis/backendApi/hooks/profile/useProfile'
import { useUpdateProfile } from '@/src/apis/backendApi/hooks/profile/useUpdateProfile'
import { onboardingDataToUpdateDTO } from '@/src/apis/backendApi/mappers/profile/profile.mapper'
import { Button } from '@/src/components/button'
import { OnboardingProgress } from '@/src/components/onboarding-progress'
import { ScrollView } from '@/src/components/scroll-view'
import { Text } from '@/src/components/text'
import { useColors } from '@/src/hooks/use-colors'
import { onboardingAtom } from '@/src/store/onboardingAtom'
import { calculateNutritionalGoals } from '@/src/utils/nutrition'

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: 'Sédentaire',
  light: 'Légèrement actif',
  moderate: 'Modérément actif',
  active: 'Très actif',
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  const c = useColors()
  return (
    <View style={tw`flex-row justify-between items-center`}>
      <Text variant="body" color="secondary">
        {label}
      </Text>
      <Text variant="body" style={{ color: c.textPrimary, fontWeight: '600' }}>
        {value}
      </Text>
    </View>
  )
}

export default function OnboardingSummaryScreen() {
  const c = useColors()
  const router = useRouter()
  const [onboarding, setOnboarding] = useAtom(onboardingAtom)
  const { data: existingProfile } = useProfile()
  const { mutate: createProfile } = useCreateProfile()
  const { mutate: updateProfile } = useUpdateProfile()

  const goals =
    onboarding.currentWeight &&
    onboarding.height &&
    onboarding.age &&
    onboarding.sex &&
    onboarding.activityLevel &&
    onboarding.targetWeight &&
    onboarding.weeklyLossKg
      ? calculateNutritionalGoals(
          onboarding.currentWeight,
          onboarding.height,
          onboarding.age,
          onboarding.sex,
          onboarding.activityLevel,
          onboarding.targetWeight,
          onboarding.weeklyLossKg,
        )
      : null

  function onStart() {
    setOnboarding((prev) => ({ ...prev, completed: true }))
    if (existingProfile) {
      updateProfile(onboardingDataToUpdateDTO(onboarding))
    } else {
      createProfile(onboarding)
    }
    router.replace('/')
  }

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={tw`p-6 gap-8`}>
        <OnboardingProgress current={6} />

        <View style={tw`gap-2`}>
          <Text variant="heading1">
            Tout est prêt{onboarding.firstName ? `, ${onboarding.firstName}` : ''} !
          </Text>
          <Text variant="body" color="secondary">
            Voici ton programme personnalisé. Tu pourras le modifier à tout moment dans Réglages.
          </Text>
        </View>

        <View
          style={[
            tw`rounded-2xl p-6 border gap-2`,
            { backgroundColor: c.surface, borderColor: c.border },
          ]}
        >
          <Text variant="heading3">Profil</Text>
          {onboarding.age && <SummaryRow label="Âge" value={`${onboarding.age} ans`} />}
          {onboarding.sex && (
            <SummaryRow label="Sexe" value={onboarding.sex === 'male' ? 'Homme' : 'Femme'} />
          )}
          {onboarding.height && <SummaryRow label="Taille" value={`${onboarding.height} cm`} />}
          {onboarding.activityLevel && (
            <SummaryRow label="Activité" value={ACTIVITY_LABELS[onboarding.activityLevel]} />
          )}
        </View>

        <View
          style={[
            tw`rounded-2xl p-6 border gap-2`,
            { backgroundColor: c.surface, borderColor: c.border },
          ]}
        >
          <Text variant="heading3">Poids</Text>
          {onboarding.currentWeight && (
            <SummaryRow label="Poids actuel" value={`${onboarding.currentWeight} kg`} />
          )}
          {onboarding.targetWeight && (
            <SummaryRow label="Poids cible" value={`${onboarding.targetWeight} kg`} />
          )}
          {onboarding.currentWeight && onboarding.targetWeight && (
            <SummaryRow
              label="À perdre"
              value={`${(onboarding.currentWeight - onboarding.targetWeight).toFixed(1)} kg`}
            />
          )}
        </View>

        {goals && (
          <View
            style={[
              tw`rounded-2xl p-6 border gap-2`,
              { backgroundColor: c.surface, borderColor: c.border },
            ]}
          >
            <Text variant="heading3">Programme nutritionnel</Text>
            <SummaryRow label="BMR" value={`${goals.bmr} kcal`} />
            <SummaryRow label="TDEE" value={`${goals.tdeeBase} kcal`} />

            <View
              style={[
                tw`flex-row justify-between items-center rounded-lg p-2`,
                { backgroundColor: `${c.primary}15` },
              ]}
            >
              <Text variant="body" style={{ fontWeight: '600' }}>
                Objectif de base
              </Text>
              <Text variant="heading3" style={{ color: c.primary }}>
                {goals.dailyKcalBase} kcal/j
              </Text>
            </View>

            <View style={[tw`h-px`, { backgroundColor: c.border }]} />
            <SummaryRow label="Protéines" value={`${goals.macros.proteines} g`} />
            <SummaryRow label="Glucides" value={`${goals.macros.glucides} g`} />
            <SummaryRow label="Lipides" value={`${goals.macros.lipides} g`} />

            {goals.estimatedWeeks > 0 && (
              <Text variant="caption" color="secondary" style={[tw`text-center mt-1`]}>
                Objectif estimé en{' '}
                <Text variant="caption" style={{ color: c.primary, fontWeight: '600' }}>
                  {goals.estimatedWeeks} semaines
                </Text>
              </Text>
            )}
          </View>
        )}

        <View style={tw`gap-2`}>
          <Button label="Retour" variant="secondary" fullWidth size="lg" onPress={router.back} />
          <Button label="Commencer !" fullWidth size="lg" onPress={onStart} />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
