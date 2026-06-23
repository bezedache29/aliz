import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'expo-router'
import { useAtom } from 'jotai'
import { Controller, useForm } from 'react-hook-form'
import { KeyboardAvoidingView, Platform, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import tw from 'twrnc'
import { z } from 'zod'

import { Button } from '@/src/components/button'
import { Input } from '@/src/components/input'
import { OnboardingProgress } from '@/src/components/onboarding-progress'
import { Text } from '@/src/components/text'
import { useColors } from '@/src/hooks/use-colors'
import { onboardingAtom } from '@/src/store/onboardingAtom'

const schema = z.object({
  currentWeight: z
    .string()
    .min(1, 'Poids requis')
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 30 && Number(v) <= 300, 'Entre 30 et 300 kg'),
})

type FormValues = z.infer<typeof schema>

export default function OnboardingWeightScreen() {
  const c = useColors()
  const router = useRouter()
  const [onboarding, setOnboarding] = useAtom(onboardingAtom)

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentWeight: onboarding.currentWeight?.toString() ?? '',
    },
  })

  function onSubmit(values: FormValues) {
    setOnboarding((prev) => ({ ...prev, currentWeight: Number(values.currentWeight) }))
    router.push('/onboarding/goal')
  }

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: c.background }]}>
      <KeyboardAvoidingView
        style={tw`flex-1`}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={tw`flex-1 p-6 gap-8`}>
          <OnboardingProgress current={3} />

          <View style={tw`gap-2`}>
            <Text variant="heading1">Ton poids actuel</Text>
            <Text variant="body" color="secondary">
              Entre ton poids du matin, à jeun. Plus tard, Aliz récupérera tes pesées Renpho
              automatiquement.
            </Text>
          </View>

          <Controller
            control={control}
            name="currentWeight"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Poids"
                placeholder="80"
                value={value?.toString() ?? ''}
                onChangeText={onChange}
                keyboardType="decimal-pad"
                unit="kg"
                autoFocus
                error={errors.currentWeight?.message}
              />
            )}
          />

          <View
            style={[
              tw`rounded-xl p-4 border`,
              { backgroundColor: c.surface, borderColor: c.border },
            ]}
          >
            <Text variant="caption" color="secondary">
              💡 Prends-toi en photo chaque semaine dans la même tenue et à la même heure — la
              balance peut varier, le miroir ne ment pas.
            </Text>
          </View>

          <View style={tw`flex-1`} />

          <View style={tw`gap-2`}>
            <Button label="Retour" variant="secondary" fullWidth size="lg" onPress={router.back} />
            <Button label="Continuer" fullWidth size="lg" onPress={handleSubmit(onSubmit)} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
