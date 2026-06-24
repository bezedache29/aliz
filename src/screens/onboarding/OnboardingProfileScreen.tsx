import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'expo-router'
import { useAtom } from 'jotai'
import { Controller, useForm } from 'react-hook-form'
import { Platform, Pressable, View } from 'react-native'
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

const schema = z.object({
  firstName: z.string().min(1, 'Prénom requis'),
  age: z
    .string()
    .min(1, 'Âge requis')
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 15 && Number(v) <= 100, 'Entre 15 et 100 ans'),
  sex: z.enum(['male', 'female'], { error: 'Sélectionne ton sexe' }),
  height: z
    .string()
    .min(1, 'Taille requise')
    .refine(
      (v) => !isNaN(Number(v)) && Number(v) >= 140 && Number(v) <= 220,
      'Entre 140 et 220 cm',
    ),
})

type FormValues = z.infer<typeof schema>

export default function OnboardingProfileScreen() {
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
      firstName: onboarding.firstName || '',
      age: onboarding.age?.toString() ?? '',
      sex: onboarding.sex ?? undefined,
      height: onboarding.height?.toString() ?? '',
    },
  })

  function onSubmit(values: FormValues) {
    setOnboarding((prev) => ({
      ...prev,
      firstName: values.firstName,
      age: Number(values.age),
      sex: values.sex,
      height: Number(values.height),
    }))
    router.push('/onboarding/activity')
  }

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: c.background }]}>
      <ScrollView
        contentContainerStyle={tw`p-6 gap-8`}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      >
        <OnboardingProgress current={1} />

        <View style={tw`gap-2`}>
          <Text variant="heading1">Parle-moi de toi</Text>
          <Text variant="body" color="secondary">
            Quelques infos pour personnaliser ton programme.
          </Text>
        </View>

        <View style={tw`gap-6`}>
          <Controller
            control={control}
            name="firstName"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Prénom"
                placeholder="Christophe"
                value={value ?? ''}
                onChangeText={onChange}
                autoCapitalize="words"
                returnKeyType="next"
                error={errors.firstName?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="age"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Âge"
                placeholder="30"
                value={value?.toString() ?? ''}
                onChangeText={onChange}
                keyboardType="numeric"
                unit="ans"
                error={errors.age?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="sex"
            render={({ field: { onChange, value } }) => (
              <View style={tw`gap-1`}>
                <Text variant="label" color="secondary" uppercase>
                  Sexe
                </Text>
                <View style={tw`flex-row gap-2`}>
                  {(['male', 'female'] as const).map((option) => {
                    const selected = value === option
                    return (
                      <Pressable
                        key={option}
                        onPress={() => onChange(option)}
                        style={[
                          tw`flex-1 py-4 rounded-xl items-center`,
                          {
                            borderWidth: 1.5,
                            borderColor: selected ? c.primary : c.border,
                            backgroundColor: selected ? `${c.primary}18` : c.surface,
                          },
                        ]}
                      >
                        <Text
                          variant="body"
                          style={{
                            color: selected ? c.primary : c.textPrimary,
                            fontWeight: '600',
                          }}
                        >
                          {option === 'male' ? 'Homme' : 'Femme'}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
                {errors.sex && (
                  <Text variant="caption" color="danger">
                    {errors.sex.message}
                  </Text>
                )}
              </View>
            )}
          />

          <Controller
            control={control}
            name="height"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Taille"
                placeholder="175"
                value={value?.toString() ?? ''}
                onChangeText={onChange}
                keyboardType="numeric"
                unit="cm"
                error={errors.height?.message}
              />
            )}
          />
        </View>

        <Button label="Continuer" fullWidth size="lg" onPress={handleSubmit(onSubmit)} />
      </ScrollView>
    </SafeAreaView>
  )
}
