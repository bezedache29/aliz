import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { useRouter } from 'expo-router'
import { useSetAtom } from 'jotai'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { KeyboardAvoidingView, Pressable, ToastAndroid, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import tw from 'twrnc'
import { z } from 'zod'

import { useProfile } from '@/src/apis/backendApi/hooks/profile/useProfile'
import { useUpdateProfile } from '@/src/apis/backendApi/hooks/profile/useUpdateProfile'
import { Button } from '@/src/components/button'
import { Input } from '@/src/components/input'
import { ScreenHeader } from '@/src/components/screen-header'
import { ScrollView } from '@/src/components/scroll-view'
import { Text } from '@/src/components/text'
import { useColors } from '@/src/hooks/use-colors'
import { onboardingAtom } from '@/src/store/onboardingAtom'

const schema = z.object({
  targetWeight: z
    .string()
    .min(1, 'Poids requis')
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 30 && Number(v) <= 300, 'Entre 30 et 300 kg'),
})

type FormValues = z.infer<typeof schema>

const LOSS_OPTIONS: { value: 0.5 | 1; label: string; description: string }[] = [
  { value: 0.5, label: '0,5 kg / semaine', description: 'Progressif et durable' },
  { value: 1, label: '1 kg / semaine', description: 'Intensif' },
]

function clampWeeklyLoss(rate: number): 0.5 | 1 {
  return rate <= 0.5 ? 0.5 : 1
}

export default function GoalEditScreen() {
  const c = useColors()
  const router = useRouter()
  const { data: profile } = useProfile()
  const setOnboarding = useSetAtom(onboardingAtom)
  const { mutate: updateProfile, isPending } = useUpdateProfile()

  const [weeklyLoss, setWeeklyLoss] = useState<0.5 | 1>(
    profile ? clampWeeklyLoss(profile.weightLossRateKg) : 0.5,
  )
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      targetWeight: profile?.targetWeightKg?.toString() ?? '',
    },
  })

  function onSubmit(values: FormValues) {
    setApiError(null)
    const targetWeightKg = Number(values.targetWeight)

    updateProfile(
      { targetWeightKg, weightLossRateKg: weeklyLoss },
      {
        onSuccess: () => {
          setOnboarding((prev) => ({
            ...prev,
            targetWeight: targetWeightKg,
            weeklyLossKg: weeklyLoss,
          }))
          ToastAndroid.show('Objectif mis à jour', ToastAndroid.SHORT)
          router.back()
        },
        onError: (error) => {
          if (isAxiosError(error) && error.response?.data?.errors) {
            const serverErrors = error.response.data.errors as Record<string, string[]>
            let hasOtherError = false
            for (const [key, messages] of Object.entries(serverErrors)) {
              if (key === 'targetWeightKg') {
                setError('targetWeight', { type: 'server', message: messages[0] })
              } else {
                hasOtherError = true
              }
            }
            if (hasOtherError) {
              setApiError('Une erreur est survenue. Vérifie les informations saisies.')
            }
          } else {
            setApiError('Une erreur est survenue. Réessaie.')
          }
        },
      },
    )
  }

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: c.background }]}>
      <ScreenHeader title="Objectif de poids" />
      <KeyboardAvoidingView style={tw`flex-1`} behavior="padding">
        <ScrollView contentContainerStyle={tw`p-6 gap-8`} keyboardShouldPersistTaps="handled">
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
                    onPress={() => setWeeklyLoss(opt.value)}
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
          </View>

          {apiError && (
            <View
              style={[
                tw`rounded-xl px-4 py-3`,
                { backgroundColor: '#ef444420', borderWidth: 1, borderColor: '#ef4444' },
              ]}
            >
              <Text variant="caption" style={{ color: '#ef4444' }}>
                {apiError}
              </Text>
            </View>
          )}

          <Button
            label="Enregistrer"
            fullWidth
            size="lg"
            loading={isPending}
            onPress={handleSubmit(onSubmit)}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
