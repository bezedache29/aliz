import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'expo-router'
import { useAtom } from 'jotai'
import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import tw from 'twrnc'
import { z } from 'zod'

import { Button } from '@/src/components/button'
import { Input } from '@/src/components/input'
import { OnboardingProgress } from '@/src/components/onboarding-progress'
import { ScrollView } from '@/src/components/scroll-view'
import { Text } from '@/src/components/text'
import { useColors } from '@/src/hooks/use-colors'
import { onboardingAtom } from '@/src/store/onboardingAtom'
import { calculateNutritionalGoals } from '@/src/utils/nutrition'

const schema = z.object({
  targetWeight: z
    .string()
    .min(1, 'Poids requis')
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 30 && Number(v) <= 300, 'Entre 30 et 300 kg'),
})

type FormValues = z.infer<typeof schema>

function MacroRow({ label, value, unit }: { label: string; value: number; unit: string }) {
  const c = useColors()
  return (
    <View style={tw`flex-row justify-between items-center`}>
      <Text variant="body" color="secondary">
        {label}
      </Text>
      <Text variant="body" style={{ color: c.textPrimary, fontWeight: '600' }}>
        {value} {unit}
      </Text>
    </View>
  )
}

const LOSS_OPTIONS: { value: 0.5 | 1; label: string; description: string }[] = [
  { value: 0.5, label: '0,5 kg / semaine', description: 'Progressif et durable' },
  { value: 1, label: '1 kg / semaine', description: 'Intensif' },
]

export default function OnboardingGoalScreen() {
  const c = useColors()
  const router = useRouter()
  const [onboarding, setOnboarding] = useAtom(onboardingAtom)
  const [weeklyLoss, setWeeklyLoss] = useState<0.5 | 1 | null>(onboarding.weeklyLossKg)
  const [lossError, setLossError] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      targetWeight: onboarding.targetWeight?.toString() ?? '',
    },
  })

  const targetWeightStr = useWatch({ control, name: 'targetWeight' })
  const targetWeightNum = Number(targetWeightStr)

  const goals =
    onboarding.currentWeight &&
    onboarding.height &&
    onboarding.age &&
    onboarding.sex &&
    onboarding.activityLevel &&
    weeklyLoss &&
    !isNaN(targetWeightNum) &&
    targetWeightNum > 0
      ? calculateNutritionalGoals(
          onboarding.currentWeight,
          onboarding.height,
          onboarding.age,
          onboarding.sex,
          onboarding.activityLevel,
          targetWeightNum,
          weeklyLoss,
        )
      : null

  const floorActive =
    goals !== null && onboarding.currentWeight !== null && onboarding.activityLevel !== null
      ? goals.dailyKcalBase === 1500 && weeklyLoss === 1
      : false

  function onSubmit(values: FormValues) {
    if (!weeklyLoss) {
      setLossError(true)
      return
    }
    setOnboarding((prev) => ({
      ...prev,
      targetWeight: Number(values.targetWeight),
      weeklyLossKg: weeklyLoss,
    }))
    router.push('/onboarding/strava')
  }

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: c.background }]}>
      <KeyboardAvoidingView
        style={tw`flex-1`}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={tw`p-6 gap-8`} keyboardShouldPersistTaps="handled">
          <OnboardingProgress current={4} />

          <View style={tw`gap-2`}>
            <Text variant="heading1">Ton objectif</Text>
            <Text variant="body" color="secondary">
              On calcule ton programme sur mesure à partir de tes données.
            </Text>
          </View>

          <Controller
            control={control}
            name="targetWeight"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Poids cible"
                placeholder="75"
                value={value?.toString() ?? ''}
                onChangeText={onChange}
                keyboardType="decimal-pad"
                unit="kg"
                autoFocus
                error={errors.targetWeight?.message}
              />
            )}
          />

          <View style={tw`gap-1`}>
            <Text variant="label" color="secondary" uppercase>
              Rythme de perte
            </Text>
            <View style={tw`flex-row gap-2`}>
              {LOSS_OPTIONS.map((opt) => {
                const selected = weeklyLoss === opt.value
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => {
                      setWeeklyLoss(opt.value)
                      setLossError(false)
                    }}
                    style={[
                      tw`flex-1 p-4 rounded-xl`,
                      {
                        gap: 2,
                        borderWidth: 1.5,
                        borderColor: selected ? c.primary : c.border,
                        backgroundColor: selected ? `${c.primary}12` : c.surface,
                      },
                    ]}
                  >
                    <Text
                      variant="body"
                      style={{ color: selected ? c.primary : c.textPrimary, fontWeight: '600' }}
                    >
                      {opt.label}
                    </Text>
                    <Text variant="caption" color="secondary">
                      {opt.description}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
            {lossError && (
              <Text variant="caption" color="danger">
                Choisis un rythme
              </Text>
            )}
            {floorActive && (
              <View
                style={[
                  tw`rounded-lg p-2 border`,
                  { backgroundColor: `${c.warning}18`, borderColor: c.warning },
                ]}
              >
                <Text variant="caption" color="warning">
                  Plancher de 1 500 kcal activé — ton déficit calculé serait trop agressif.
                </Text>
              </View>
            )}
          </View>

          {goals && (
            <View
              style={[
                tw`rounded-2xl p-6 border gap-4`,
                { backgroundColor: c.surface, borderColor: c.border },
              ]}
            >
              <Text variant="heading3">Ton programme</Text>

              <View style={tw`gap-2`}>
                <MacroRow label="Métabolisme de base (BMR)" value={goals.bmr} unit="kcal" />
                <MacroRow label="Dépense totale (TDEE)" value={goals.tdeeBase} unit="kcal" />

                <View style={[tw`h-px my-1`, { backgroundColor: c.border }]} />

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

                <View style={[tw`h-px my-1`, { backgroundColor: c.border }]} />

                <Text variant="label" color="muted" uppercase>
                  Macros
                </Text>
                <MacroRow label="Protéines" value={goals.macros.proteines} unit="g" />
                <MacroRow label="Glucides" value={goals.macros.glucides} unit="g" />
                <MacroRow label="Lipides" value={goals.macros.lipides} unit="g" />

                {goals.estimatedWeeks > 0 && (
                  <>
                    <View style={[tw`h-px my-1`, { backgroundColor: c.border }]} />
                    <Text variant="caption" color="secondary" style={tw`text-center`}>
                      Objectif estimé en{' '}
                      <Text variant="caption" style={{ color: c.primary, fontWeight: '600' }}>
                        {goals.estimatedWeeks} semaines
                      </Text>{' '}
                      à ce rythme
                    </Text>
                  </>
                )}
              </View>
            </View>
          )}

          <View style={tw`gap-2`}>
            <Button label="Retour" variant="secondary" fullWidth size="lg" onPress={router.back} />
            <Button label="Continuer" fullWidth size="lg" onPress={handleSubmit(onSubmit)} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
