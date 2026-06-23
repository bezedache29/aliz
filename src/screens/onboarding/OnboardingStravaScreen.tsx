import { useRouter } from 'expo-router'
import { useAtomValue } from 'jotai'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import tw from 'twrnc'

import { Button } from '@/src/components/button'
import { OnboardingProgress } from '@/src/components/onboarding-progress'
import { Text } from '@/src/components/text'
import { useColors } from '@/src/hooks/use-colors'
import { ACTIVITY_COEFFICIENTS } from '@/src/models/user/user.model'
import { onboardingAtom } from '@/src/store/onboardingAtom'
import { calculateBMR } from '@/src/utils/nutrition'

const INCREMENTS = [
  { range: '0 – 300 kcal brûlées', bonus: 0, note: 'objectif de base' },
  { range: '300 – 600 kcal', bonus: 150 },
  { range: '600 – 1 000 kcal', bonus: 300 },
  { range: '1 000 – 1 500 kcal', bonus: 500 },
  { range: '1 500+ kcal', bonus: 700 },
]

export default function OnboardingStravaScreen() {
  const c = useColors()
  const router = useRouter()
  const onboarding = useAtomValue(onboardingAtom)

  const deficit = onboarding.weeklyLossKg === 1 ? 1000 : 500

  const base =
    onboarding.currentWeight &&
    onboarding.height &&
    onboarding.age &&
    onboarding.sex &&
    onboarding.activityLevel
      ? Math.max(
          1500,
          Math.round(
            calculateBMR(
              onboarding.currentWeight,
              onboarding.height,
              onboarding.age,
              onboarding.sex,
            ) * ACTIVITY_COEFFICIENTS[onboarding.activityLevel],
          ) - deficit,
        )
      : null

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: c.background }]}>
      <View style={tw`flex-1 p-6 gap-8`}>
        <OnboardingProgress current={5} />

        <View style={tw`gap-2`}>
          <Text variant="heading1">Connecte Strava</Text>
          <Text variant="body" color="secondary">
            Aliz ajuste ton objectif calorique chaque jour selon tes activités — vélo, course,
            randonnée.
          </Text>
        </View>

        <View
          style={[
            tw`rounded-2xl border overflow-hidden`,
            { backgroundColor: c.surface, borderColor: c.border },
          ]}
        >
          <View style={[tw`p-4 border-b`, { borderBottomColor: c.border }]}>
            <Text variant="heading3">Paliers caloriques</Text>
            <Text variant="caption" color="muted" style={tw`mt-0.5`}>
              Calories brûlées → objectif du jour
            </Text>
          </View>

          {INCREMENTS.map((row, i) => {
            const target = base ? base + row.bonus : null
            return (
              <View
                key={i}
                style={[
                  tw`flex-row items-center justify-between px-4 py-2`,
                  i < INCREMENTS.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: c.border,
                  },
                  row.bonus === 0 && { backgroundColor: `${c.primary}10` },
                ]}
              >
                <View style={{ gap: 1 }}>
                  <Text variant="body" color="secondary">
                    {row.range}
                  </Text>
                  {row.note && (
                    <Text variant="caption" color="muted">
                      {row.note}
                    </Text>
                  )}
                </View>
                <Text variant="body" style={{ color: c.primary, fontWeight: '600' }}>
                  {target ? `${target} kcal` : `base + ${row.bonus > 0 ? `+${row.bonus}` : '0'}`}
                </Text>
              </View>
            )
          })}
        </View>

        <View style={tw`flex-1`} />

        <View style={tw`gap-2`}>
          <Button label="Retour" variant="secondary" fullWidth size="lg" onPress={router.back} />
          <Button label="Connecter Strava" fullWidth size="lg" disabled onPress={() => {}} />
          <Text variant="caption" color="muted" style={tw`text-center`}>
            Disponible prochainement — connexion OAuth2 via le serveur
          </Text>
          <Button
            label="Passer cette étape"
            variant="ghost"
            fullWidth
            size="lg"
            onPress={() => router.push('/onboarding/summary')}
          />
        </View>
      </View>
    </SafeAreaView>
  )
}
